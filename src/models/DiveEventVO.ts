import UserResponse from "./responses/UserResponse";
import AbstractDiveEvent from "./AbstractDiveEvent";

interface DiveEventVO extends AbstractDiveEvent {
    published: boolean;
    organizer: UserResponse;
    participants: UserResponse[];
}

export default DiveEventVO;