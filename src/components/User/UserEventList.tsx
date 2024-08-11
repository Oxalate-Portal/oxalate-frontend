import { Link } from "react-router-dom";
import { DiveEventListItemResponse } from "../../models/responses";

interface UserEventListProps {
    eventType: string,
    events: DiveEventListItemResponse[]
}

export function UserEventList({eventType, events}: UserEventListProps) {
    return (
            <div>
                <ul>
                    {events && events.map((event: DiveEventListItemResponse) => {
                                // We can not yet use the generic EventDetails component here, because the event object does not contain list of
                                // participants or detailed organizer
                                return (
                                        <li key={eventType + "-" + event.id}>
                                            <Link to={`/events/${event.id}/show`}>{new Date(event.startTime).toISOString().split("T")[0]}: {event.title}</Link>
                                        </li>);
                            }
                    )}
                </ul>
            </div>
    );
}
