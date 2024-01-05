interface AbstractDiveEvent {
    id: number;
    type: string;
    title: string;
    description: string;
    startTime: Date;
    eventDuration: number;
    maxDuration: number;
    maxDepth: number;
    maxParticipants: number;
    published: boolean;
}

export default AbstractDiveEvent;