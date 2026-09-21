import {fileTransferAPI} from "../../../services";
import {type AvatarFileResponse, SortDirectionEnum} from "../../../models";
import {commonFileColumns} from "./commonColumns";
import {OxTable, usePagedTable} from "../../main";
import {useTranslation} from "react-i18next";

export function AvatarFiles() {
    const {t} = useTranslation();
    const avatarTable = usePagedTable<AvatarFileResponse>((request) => fileTransferAPI.findAllAvatarFiles(request), {
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC
    });

    const columns = commonFileColumns(t, {showPreview: true});

    return (
        <>
            {avatarTable.contextHolder}
            <OxTable
                columns={columns}
                dataSource={avatarTable.dataSource}
                rowKey="id"
                loading={avatarTable.loading}
                bordered
                pagination={avatarTable.pagination}
                onChange={avatarTable.handleTableChange}
            />
        </>
    );
}
