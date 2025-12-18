import {useTranslation} from "react-i18next";
import {Select, Space, Spin} from "antd";
import {diveEventAPI, downloadAPI, userAPI} from "../../services";
import {useState} from "react";
import {CSVLink} from "react-csv";
import {DownloadOutlined} from "@ant-design/icons";
import {DownloadTypeEnum} from "../../models";

function DownloadData() {
    const {t} = useTranslation();
    const downloadSelectOptions = [
        {label: t("DownloadData.certificateLabel"), value: DownloadTypeEnum.CERTIFICATE},
        {label: t("DownloadData.diveLabel"), value: DownloadTypeEnum.DIVE},
        {label: t("DownloadData.diveEventLabel"), value: DownloadTypeEnum.DIVE_EVENT},
        {label: t("DownloadData.userLabel"), value: DownloadTypeEnum.MEMBER},
        {label: t("DownloadData.paymentLabel"), value: DownloadTypeEnum.PAYMENT}
    ];

    const [loading, setLoading] = useState<boolean>(false);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [rowCount, setRowCount] = useState<number>(0);
    const [downloadFileName, setDownloadFileName] = useState<string>("undefined.csv");
    const [csvData, setCsvData] = useState<any>(null);
    const [csvHeaders, setCsvHeaders] = useState<{ label: string, key: string }[]>([]);

    function selectToDownload(value: DownloadTypeEnum) {
        setDataLoaded(false);

        switch (value) {
            case DownloadTypeEnum.CERTIFICATE:
                setCsvHeaders([
                    {label: "Certificate ID", key: "id"},
                    {label: "Member ID", key: "userId"},
                    {label: "Member name", key: "memberName"},
                    {label: "Organization", key: "organization"},
                    {label: "Certificate name", key: "certificateName"},
                    {label: "Certificate ID", key: "certificateId"},
                    {label: "Diver ID", key: "diverId"},
                    {label: "Certification date", key: "certificationDate"}
                ]);
                downloadData(() => downloadAPI.downloadCertificates(), "certificates");
                break;
            case DownloadTypeEnum.DIVE:
                setCsvHeaders([
                    {label: "Member ID", key: "id"},
                    {label: "Name", key: "name"},
                    {label: "Dive count", key: "diveCount"}
                ]);
                downloadData(() => downloadAPI.downloadDives(), "dives");
                break;
            case DownloadTypeEnum.DIVE_EVENT:
                setCsvHeaders([
                    {label: "Event ID", key: "id"},
                    {label: "Event type", key: "type"},
                    {label: "Title", key: "title"},
                    {label: "Description", key: "description"},
                    {label: "Start time", key: "startTime"},
                    {label: "Event duration", key: "eventDuration"},
                    {label: "Max duration", key: "maxDuration"},
                    {label: "Max depth", key: "maxDepth"},
                    {label: "Max participants", key: "maxParticipants"},
                    {label: "Organizer, last name", key: "organizer.lastName"},
                    {label: "Organizer, first name", key: "organizer.firstName"},
                ]);
                downloadData(() => diveEventAPI.findAllPastDiveEvents(), "dive-events");
                break;
            case DownloadTypeEnum.MEMBER:
                setCsvHeaders([
                    {label: "Member ID", key: "id"},
                    {label: "Username", key: "username"},
                    {label: "First name", key: "firstName"},
                    {label: "Last name", key: "lastName"},
                    {label: "Phone number", key: "phoneNumber"},
                    {label: "Registered", key: "registered"},
                    {label: "Language", key: "language"},
                    {label: "Roles", key: "roles"},
                    {label: "Status", key: "status"},
                    {label: "Privacy", key: "privacy"},
                    {label: "Next of kin", key: "nextOfKin"},
                    {label: "Dive count", key: "diveCount"},
                    {label: "Approved terms", key: "approvedTerms"},
                ]);
                downloadData(() => userAPI.findAll(), "members");
                break;
            case DownloadTypeEnum.PAYMENT:
                setCsvHeaders([
                    {label: "Payment ID", key: "id"},
                    {label: "Member ID", key: "userId"},
                    {label: "Member name", key: "name"},
                    {label: "Payment count", key: "paymentCount"},
                    {label: "Payment type", key: "paymentType"},
                    {label: "Created", key: "createdAt"}
                ]);
                downloadData(() => downloadAPI.downloadPayments(), "payments");
                break;
            default:
                console.error("Unknown download type:", value);
        }
    }

    function downloadData<T>(callback: () => Promise<T[]>, dataName: string): void {
        setLoading(true);
        callback()
                .then(response => {
                    setRowCount(response.length);
                    setDataLoaded(true);
                    // Set download file name to current date
                    const date = new Date();
                    setDownloadFileName(`${dataName}-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.csv`);
                    setCsvData(response);
                })
                .catch(error => {
                    console.error(`Failed to download ${dataName}:`, error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <h4>{t("DownloadData.header")}</h4>
                    <p>{t("DownloadData.description")}</p>
                    <p>{t("DownloadData.gdprWarning")}</p>
                    <p>{t("DownloadData.choose")}</p>
                    <Select options={downloadSelectOptions}
                            style={{width: 300}}
                            onChange={(value) => {
                                selectToDownload(value);
                            }}
                    /><br/>
                    {dataLoaded &&
                            <Space orientation={"vertical"} size={"middle"}>
                                <p/>
                                <p>{t("DownloadData.rowCount", {count: rowCount})}</p>
                                <Space orientation={"horizontal"} size={"middle"}>
                                    {t("DownloadData.downloadPrompt")}
                                    <CSVLink filename={downloadFileName}
                                             data={csvData}
                                             headers={csvHeaders}
                                    ><DownloadOutlined/></CSVLink>
                                </Space>
                            </Space>}
                </Spin>
            </div>
    );
}

export { DownloadData };