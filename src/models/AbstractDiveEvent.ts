interface AbstractDiveEvent {
    id: number;
    type: string;
    title: string;
    description: string;
    startTime: Date;
    eventDuration: number;
    maxDuration1: number;
    maxDepth: number;
    maxParticipants: number;
}

export default AbstractDiveEvent;