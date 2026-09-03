'use client';

import { Button } from '@/components/ui/Button';

export function DeleteSondageButton() {
  return (
    <Button
      type="submit"
      variant="danger"
      size="sm"
      onClick={(e) => {
        if (!confirm('Voulez-vous vraiment supprimer ce sondage ? Cette action est irréversible.')) {
          e.preventDefault();
        }
      }}
    >
      Supprimer
    </Button>
  );
}
