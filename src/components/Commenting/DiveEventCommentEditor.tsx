import { useEffect, useState } from "react";
import { commentAPI } from "../../services";

interface DiveEventCommentEditorProps {
    diveEventId?: any;
}

export function DiveEventCommentEditor({diveEventId}: DiveEventCommentEditorProps) {
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        setLoading(true);

        commentAPI.findAllForParentId(diveEventId)
    }, []);
    return (
            <>
                You can add a comment here
            </>
    );
}
