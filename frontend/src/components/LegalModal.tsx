import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileText, ShieldCheck, UsersThree, X } from '@phosphor-icons/react';
import { LEGAL_VERSION, type LegalSection } from '../data/legal';

interface LegalModalProps {
  open: boolean;
  section: LegalSection;
  onSectionChange: (section: LegalSection) => void;
  onClose: () => void;
}

const TABS = [
  { id: 'terms', label: 'Términos', icon: FileText },
  { id: 'privacy', label: 'Privacidad', icon: ShieldCheck },
  { id: 'rules', label: 'Reglas', icon: UsersThree },
] as const;

export default function LegalModal({ open, section, onSectionChange, onClose }: LegalModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="legal-shell" role="dialog" aria-modal="true" aria-labelledby="legal-title">
      <button className="legal-backdrop" type="button" aria-label="Cerrar documentos legales" onClick={onClose} />
      <article className="legal-panel">
        <header className="legal-head">
          <div>
            <p>q2play · Versión {LEGAL_VERSION}</p>
            <h2 id="legal-title">Acuerdos claros para jugar tranquilo</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar" className="legal-close"><X /></button>
        </header>

        <nav className="legal-tabs" aria-label="Documentos legales">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={section === id} onClick={() => onSectionChange(id)}>
              <Icon weight={section === id ? 'fill' : 'regular'} /> {label}
            </button>
          ))}
        </nav>

        <div className="legal-content">
          {section === 'terms' ? <Terms /> : section === 'privacy' ? <Privacy /> : <Rules />}
        </div>
      </article>
    </div>,
    document.body,
  );
}

function Terms() {
  return <>
    <p className="legal-updated">Vigentes desde el 22 de agosto de 2026</p>
    <h3>1. Qué ofrece q2play</h3>
    <p>q2play facilita encuentros voluntarios entre personas que quieren jugar videojuegos. La compatibilidad es una recomendación y no garantiza conducta, nivel, disponibilidad ni resultados dentro del juego.</p>
    <h3>2. Edad y cuenta</h3>
    <p>Debes tener al menos 18 años. Proporciona datos correctos, protege tus credenciales y no suplantes a otra persona. Tu género y preferencias se usan únicamente para respetar el consentimiento mutuo del match.</p>
    <h3>3. Match y servicios externos</h3>
    <p>Los datos de contacto sólo se muestran después de un match aceptado por ambas personas. Discord y Riot son servicios independientes con sus propios términos. q2play no está afiliado ni respaldado por esas marcas.</p>
    <h3>4. Conducta y contenido</h3>
    <p>No se permiten amenazas, acoso, odio, contenido sexual no solicitado, fraude, spam, suplantación ni divulgación de datos privados. Podemos limitar o cancelar cuentas que pongan en riesgo a la comunidad.</p>
    <h3>5. Disponibilidad y responsabilidad</h3>
    <p>El servicio puede cambiar o interrumpirse. Ante una situación incómoda, cierra el chat o la sala, conserva evidencia y usa los canales oficiales de soporte. Nada de estos términos limita derechos que la ley aplicable no permita limitar.</p>
    <h3>6. Cambios</h3>
    <p>Cuando haya cambios materiales se publicará una nueva versión y se solicitará aceptación cuando corresponda. Continuar usando la versión vigente implica cumplir estos acuerdos.</p>
  </>;
}

function Privacy() {
  return <>
    <p className="legal-updated">Aviso de Privacidad · Versión {LEGAL_VERSION}</p>
    <h3>Datos que tratamos</h3>
    <p>Cuenta (usuario, email y contraseña protegida), perfil, género, preferencias de búsqueda, conexiones opcionales de Riot/Discord, matches y mensajes necesarios para prestar el servicio.</p>
    <h3>Para qué se usan</h3>
    <p>Autenticarte, calcular compatibilidad recíproca, mostrar tu perfil, habilitar chat, crear una sala privada de voz cuando ambos conectaron Discord, prevenir abuso y mantener el servicio.</p>
    <h3>Qué compartimos</h3>
    <p>La otra persona ve sólo la información de perfil necesaria. El contacto de Discord se revela tras aceptación mutua. No vendemos datos personales. Proveedores de infraestructura procesan lo indispensable para operar q2play.</p>
    <h3>Control y conservación</h3>
    <p>Puedes desconectar integraciones o eliminar tu cuenta desde Ajustes. Al eliminarla se borran sus datos vinculados, salvo información mínima que deba conservarse por seguridad u obligación legal.</p>
    <h3>Seguridad</h3>
    <p>Aplicamos controles técnicos razonables, pero ningún sistema es infalible. No publiques dirección, documentos, credenciales, ubicación precisa ni otra información sensible en chats o voz.</p>
  </>;
}

function Rules() {
  const rules = [
    ['Respeto primero', 'Cero acoso, discriminación, amenazas o contenido sexual no solicitado.'],
    ['Invitación personal', 'La sala de voz pertenece sólo a las dos personas del match; no compartas el enlace.'],
    ['Privacidad', 'No pidas ni publiques datos sensibles, ubicación, documentos o credenciales.'],
    ['Consentimiento', 'No grabes, retransmitas ni publiques la voz o mensajes de otra persona sin permiso.'],
    ['Juego limpio', 'Nada de trampas, venta de cuentas, fraude, spam o suplantación.'],
    ['Sal cuando quieras', 'Un match no crea obligación. Puedes cerrar el chat o salir de voz en cualquier momento.'],
    ['Reporta riesgos', 'Conserva evidencia y usa los canales oficiales si hay amenazas o conducta peligrosa.'],
    ['Sólo adultos', 'q2play y sus salas de match están destinados a personas de 18 años o más.'],
  ];
  return <>
    <p className="legal-updated">Reglas para chats y salas privadas</p>
    <ol className="legal-rules">
      {rules.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}
    </ol>
  </>;
}
