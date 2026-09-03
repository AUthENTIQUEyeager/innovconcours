import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase, createServerSupabase } from "@/lib/supabase/server";

const createSondageSchema = z.object({
  question: z.string().min(1, "La question est obligatoire"),
  description: z.string().nullable().optional(),
  options: z.array(z.string().min(1, "Le texte de l'option est obligatoire")).min(2, "Au moins 2 options sont requises"),
});

const updateSondageSchema = z.object({
  question: z.string().min(1, "La question est obligatoire"),
  description: z.string().nullable().optional(),
});

const updateOptionsSchema = z.object({
  options: z.array(z.string().min(1, "Le texte de l'option est obligatoire")).min(2, "Au moins 2 options sont requises"),
});

export async function POST(req: NextRequest) {
  // First, check if the user is authenticated and is an admin
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Check if the user is an admin by fetching their profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Parse and validate the body
  const parsed = createSondageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { question, description, options } = parsed.data;

  const admin = createAdminSupabase(); // Use service role key for inserts to bypass RLS if needed

  try {
    // Start a transaction: insert the poll, then insert the options
    // We'll do it sequentially for simplicity

    // 1. Insert the poll
    const { data: pollData, error: pollError } = await admin
      .from('polls')
      .insert({
        question,
        description: description ?? null,
        status: 'draft', // By default, new polls are in draft
        created_by: user.id,
      })
      .select('id')
      .single();

    if (pollError) {
      throw pollError;
    }

    const pollId = pollData.id;

    // 2. Insert the options
    const optionsToInsert = options.map((text, index) => ({
      poll_id: pollId,
      text,
      position: index,
    }));

    const { error: optionsError } = await admin
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      // If options insertion fails, we should delete the poll to avoid orphan
      await admin.from('polls').delete().eq('id', pollId);
      throw optionsError;
    }

    return NextResponse.json({ success: true, pollId }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating sondage:', err);
    return NextResponse.json(
      { error: err.message ?? 'Erreur lors de la création du sondage' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // First, check if the user is authenticated and is an admin
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Check if the user is an admin by fetching their profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Parse and validate the body for question and description update
  const parsed = updateSondageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { question, description } = parsed.data;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "ID du sondage manquant" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  try {
    // Update the poll question and description
    const descSafe = description ? description.trim() || null : null;
    const { error: updateError } = await admin
      .from('polls')
      .update({
        question: question.trim(),
        description: descSafe,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating sondage:', err);
    return NextResponse.json(
      { error: err.message ?? 'Erreur lors de la mise à jour du sondage' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // First, check if the user is authenticated and is an admin
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Check if the user is an admin by fetching their profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Parse and validate the body for options update
  const parsed = updateOptionsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { options } = parsed.data;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: "ID du sondage manquant" }, { status: 400 });
  }

  const admin = createAdminSupabase();

  try {
    // Check if there are any votes for this poll
    const { count: voteCount, error: votesError } = await admin
      .from('poll_votes')
      .select('id', { count: 'exact', head: true })
      .eq('poll_id', id);

    if (votesError) {
      throw votesError;
    }

    if ((voteCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Impossible de modifier les options après que des votes ont été enregistrés' },
        { status: 400 }
      );
    }

    // Start a transaction: delete existing options, then insert new ones
    // Delete existing options
    const { error: deleteError } = await admin
      .from('poll_options')
      .delete()
      .eq('poll_id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new options
    const optionsToInsert = options.map((text, index) => ({
      poll_id: id,
      text: text.trim(),
      position: index,
    }));

    const { error: insertError } = await admin
      .from('poll_options')
      .insert(optionsToInsert);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating sondage options:', err);
    return NextResponse.json(
      { error: err.message ?? 'Erreur lors de la mise à jour des options du sondage' },
      { status: 500 }
    );
  }
}