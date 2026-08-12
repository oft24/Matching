import { Plus, UsersThree } from '@phosphor-icons/react';
import PageHeader from './PageHeader';

/**
 * Grupos todavía no tiene respaldo en la base de datos, así que la pantalla no
 * inventa contenido: muestra el estado vacío real en lugar de datos de prueba.
 */
export default function GroupsPage() {
  return (
    <section className="mb-8">
      <PageHeader
        kicker="TU COMUNIDAD"
        title="Grupos"
        description="Escuadras para jugar en equipo de forma recurrente."
        action={
          <button
            disabled
            title="Disponible cuando se habilite el almacenamiento de grupos"
            className="primary-button flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-45"
          >
            <Plus className="h-4 w-4" /> Crear grupo
          </button>
        }
      />

      <div className="surface anim-fade-up rounded-[var(--radius-lg)] p-12 text-center">
        <UsersThree className="mx-auto mb-4 h-10 w-10 text-[color-mix(in_srgb,var(--color-text)_35%,transparent)]" />
        <p className="text-[17px] font-medium text-[var(--color-text)]">Todavía no hay grupos</p>
        <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-[color-mix(in_srgb,var(--color-text)_62%,transparent)]">
          Esta sección aún no está conectada a la base de datos. Cuando lo esté, aquí verás los
          grupos a los que perteneces y podrás crear los tuyos.
        </p>
        <p className="mt-5 text-[12px] text-[color-mix(in_srgb,var(--color-text)_42%,transparent)]">
          Mientras tanto, usa <strong className="font-medium text-[var(--color-accent)]">Buscar jugadores</strong> para
          formar equipo.
        </p>
      </div>
    </section>
  );
}
