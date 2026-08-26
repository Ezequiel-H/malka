import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PublicTagPicker from '../../components/tags/PublicTagPicker';
import { userPublicTags } from '../../utils/tagFields';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import { Button, Card } from '../../components/ui';

const MyInterests = () => {
  const { user, fetchUser, updateMyTags } = useAuth();
  const { showSuccess, showError } = useToast();
  const [availableTags, setAvailableTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('/tags?activa=true');
        setAvailableTags(res.data.tags || []);
      } catch (e) {
        console.error(e);
        showError('No se pudieron cargar las tags');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showError]);

  useEffect(() => {
    if (user) {
      setTags(userPublicTags(user));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateMyTags(tags);
    setSaving(false);
    if (result.success) {
      showSuccess('Tus intereses se guardaron correctamente');
      await fetchUser();
    } else {
      showError(result.message || 'Error al guardar');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <PageContainer title="Mis intereses" maxWidth="4xl">
      <Card>
        <p className="mb-6 text-ink-muted">
          Elegí las áreas que te interesan. Las usamos para mostrarte actividades alineadas a tus
          preferencias. Podés cambiar esta lista cuando quieras.
        </p>

        <form onSubmit={handleSubmit}>
          <PublicTagPicker
            variant="tile"
            availableTags={availableTags}
            selectedNames={tags}
            onChange={setTags}
            emptyHint={
              <p className="mt-2 text-sm text-ink-muted">
                No hay tags en el catálogo. Un administrador puede cargarlas en Tags públicos.
              </p>
            }
          />

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {tags.length === 0
                ? 'Sin intereses elegidos'
                : `${tags.length} ${tags.length === 1 ? 'interés elegido' : 'intereses elegidos'}`}
            </p>
            <Button type="submit" loading={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
};

export default MyInterests;
