import {useTranslation} from "react-i18next";
import {Select, Space, Spin} from "antd";
import {userAPI} from "../../services";
import {useState} from "react";

enum DownLoadTypeEnum {
    MEMBER = "MEMBER",
    EVENT = "EVENT",
    DIVE = "DIVE",
    PAYMENT = "PAYMENT"
}

function DownloadData() {
    const {t} = useTranslation();
    const downloadSelectOptions = [
        {label: t('DownloadData.memberLabel'), value: DownLoadTypeEnum.MEMBER},
        {label: t('DownloadData.eventLabel'), value: DownLoadTypeEnum.EVENT},
        {label: t('DownloadData.diveLabel'), value: DownLoadTypeEnum.DIVE},
        {label: t('DownloadData.paymentLabel'), value: DownLoadTypeEnum.PAYMENT},
    ];
    const [loading, setLoading] = useState<boolean>(false);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [rowCount, setRowCount] = useState<number>(0);

    function selectToDownload(value: DownLoadTypeEnum) {
        switch (value) {
            case DownLoadTypeEnum.MEMBER:
                console.log("Download members");
                downloadMembers();
                break;
            case DownLoadTypeEnum.EVENT:
                console.log("Download events");
                break;
            case DownLoadTypeEnum.DIVE:
                console.log("Download dives");
                break;
            case DownLoadTypeEnum.PAYMENT:
                console.log("Download payments");
                break;
            default:
                console.error("Unknown download type:", value);
        }
    }

    function downloadMembers() {
        console.log("Download members");
        setLoading(true)
        userAPI.findAll()
                .then(response => {
                    console.log("Members:", response);
                    setRowCount(response.length);
                    setDataLoaded(true);
                })
                .catch(error => {
                    console.error("Failed to download members:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <div className={'darkDiv'}>
                <Spin spinning={loading}>
                    <h4>{t('DownloadData.header')}</h4>
                    <p>{t('DownloadData.description')}</p>
                    <p>{t('DownloadData.gdprWarning')}</p>
                    <p>{t('DownloadData.choose')}</p>
                    <Select options={downloadSelectOptions}
                            style={{width: 300}}
                            onChange={(value) => {
                                selectToDownload(value)
                            }}
                    /><br/>
                    {dataLoaded &&
                            <Space direction={"vertical"} size={"middle"}>
                                <p>{t('DownloadData.rowCount', {count: rowCount})}</p>


                            </Space>}
                </Spin>
            </div>
    );
}

export {DownloadData}