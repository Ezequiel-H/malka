import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { buildWaLink, renderPlantilla } from '../../utils/whatsapp';
import { Alert, Button } from '../ui';

/**
 * El paso que sigue al registro para quien no vive en Buenos Aires: el equipo
 * le pide por WhatsApp lo que haga falta. Se muestra mientras la cuenta está
 * pendiente; el mensaje y el número salen de Ajustes.
 */
const CompletarPorWhatsapp = ({ className = '' }) => {
  const { user } = useAuth();
  const [contacto, setContacto] = useState(null);
  const aplica = user?.estado === 'pending' && user?.residencia && user.residencia !== 'buenos_aires';

  useEffect(() => {
    if (!aplica) return undefined;
    let vivo = true;
    axios
      .get('/auth/registro-whatsapp')
      .then((r) => vivo && setContacto(r.data))
      .catch(() => vivo && setContacto(null));
    return () => {
      vivo = false;
    };
  }, [aplica]);

  if (!aplica || !contacto?.completarPorWhatsapp) return null;

  const texto = renderPlantilla(contacto.mensaje, {
    nombre: [user.nombre, user.apellido].filter(Boolean).join(' '),
    ciudad: user.ciudad ?? '',
  });
  const href = buildWaLink(contacto.numero, texto);
  if (!href) return null;

  return (
    <Alert
      tone="warning"
      title="Terminá tu registro por WhatsApp"
      titleAs="h2"
      className={className}
      action={
        <Button href={href} target="_blank" rel="noopener noreferrer" icon="whatsapp" size="sm">
          Escribirnos
        </Button>
      }
    >
      Como no vivís en Buenos Aires, necesitamos pedirte unos datos más. Escribinos por WhatsApp y te contamos qué
      falta.
    </Alert>
  );
};

export default CompletarPorWhatsapp;
