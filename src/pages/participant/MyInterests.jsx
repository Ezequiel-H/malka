import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PublicTagPicker from '../../components/tags/PublicTagPicker';
import { userPublicTags } from '../../utils/tagFields';
import LoadingScreen from '../../components/layout/LoadingScreen';
import PageContainer from '../../components/layout/PageContainer';
import { Button, Card } from '../../components/ui';
import { useIdioma } from '../../i18n';

const MyInterests = () => {
  const { user, fetchUser, updateMyTags } = useAuth();
  const { showSuccess, showError } = useToast();
  const { t } = useIdioma();
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
        showError(t('misIntereses.errorTags'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showError, t]);

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
      showSuccess(t('misIntereses.guardados'));
      await fetchUser();
    } else {
      showError(result.message || t('misIntereses.errorGuardar'));
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <PageContainer title={t('shell.links.intereses')} maxWidth="4xl">
      <Card>
        <p className="mb-6 text-ink-muted">
          {t('misIntereses.texto')}
        </p>

        <form onSubmit={handleSubmit}>
          <PublicTagPicker
            variant="tile"
            availableTags={availableTags}
            selectedNames={tags}
            onChange={setTags}
            emptyHint={
              <p className="mt-2 text-sm text-ink-muted">
                {t('misIntereses.sinCatalogo')}
              </p>
            }
          />

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {tags.length === 0
                ? t('misIntereses.ninguno')
                : t(tags.length === 1 ? 'misIntereses.uno' : 'misIntereses.varios', { cantidad: tags.length })}
            </p>
            <Button type="submit" loading={saving}>
              {saving ? t('comun.guardando') : t('comun.guardar')}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
};

export default MyInterests;
