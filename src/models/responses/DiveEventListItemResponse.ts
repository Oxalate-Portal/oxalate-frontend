import AbstractDiveEvent from "../AbstractDiveEvent";

interface DiveEventVO extends AbstractDiveEvent {
    published: boolean;
    organizerName: string;
    participantCount: number;
}

export default DiveEventVO;