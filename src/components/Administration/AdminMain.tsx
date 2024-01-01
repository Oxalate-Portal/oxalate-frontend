import {Space} from "antd";
import {useTranslation} from "react-i18next";

export function AdminMain() {
    const { t } = useTranslation();

    return (
            <div  className={'darkDiv'}>
                <Space direction={'vertical'}>
                    <h3>{t('AdminMain.header')}</h3>

                    <p>{t('AdminMain.text')}.</p>

                    <h5>{t('AdminMain.memberHeader')}:</h5>

                    <p>{t('AdminMain.memberText')}.</p>

                    <h5>{t('AdminMain.paymentHeader')}:</h5>

                    <p>{t('AdminMain.paymentText')}.</p>

                    <h5>{t('AdminMain.statsHeader')}:</h5>

                    <p>{t('AdminMain.statsText1')}.</p>

                    <p>{t('AdminMain.statsText2')}.</p>
                </Space>
            </div>
    );
}
