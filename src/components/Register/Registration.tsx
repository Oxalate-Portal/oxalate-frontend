import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Registration() {
    const [searchParams] = useSearchParams();
    const registrationStatus = searchParams.get('status');
    const {t} = useTranslation();

  return (
          <div className="darkDiv">
              {registrationStatus === 'OK' && <h4>{t('Registration.title.ok')}</h4>}
              {registrationStatus === 'INVALID' && <h4>{t('Registration.title.invalid')}</h4>}
          </div>
  );
}