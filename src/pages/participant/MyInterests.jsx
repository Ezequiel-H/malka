import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PublicTagPicker from '../../components/tags/PublicTagPicker';
import { userPublicTags } from '../../utils/tagFields';

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
    return (
      <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center">
        <div className="spinner" />
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto card min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Mis intereses</h1>
        <p className="text-gray-600 mb-6">
          Elegí las áreas que te interesan. Las usamos para mostrarte actividades alineadas a tus preferencias.
          Podés cambiar esta lista cuando quieras.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="block font-medium text-gray-800 mb-2">Tags públicos</label>
          <PublicTagPicker
            availableTags={availableTags}
            selectedNames={tags}
            onChange={setTags}
            emptyHint={
              <p className="text-sm text-gray-500 mt-2">
                No hay tags en el catálogo. Un administrador puede cargarlas en Tags públicos.
              </p>
            }
          />
          <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyInterests;
