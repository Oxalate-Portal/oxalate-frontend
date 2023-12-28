import {NavigateFunction} from "react-router-dom";
import {Alert, Button} from "antd";
import {useTranslation} from "react-i18next";

interface SubmitResultProps {
    updateStatus: { message: string, status: string },
    navigate: NavigateFunction
}

function SubmitResult({ updateStatus, navigate }: SubmitResultProps) {
    const {t} = useTranslation();

    if (updateStatus.status === 'OK') {
        window.dispatchEvent(new Event('reloadNavigationEvent'));
        return (<><div className={'darkDiv'}>
            <Alert type={'success'}
                   showIcon
                   message={updateStatus.message}
                   action={<Button type={'primary'} onClick={() => navigate(-1)}>{t('common.button.back')}</Button>}
            />
        </div></>);
    } else if (updateStatus.status === 'ERROR') {
        return (<div className={'darkDiv'}>
            <Alert type={'error'}
                   showIcon
                   message={updateStatus.message}
                   action={<Button type={'primary'} onClick={() => navigate(-1)}>{t('common.button.back')}</Button>}
            />
        </div>);
    } else {
        return (<></>);
    }
}

export default SubmitResult;