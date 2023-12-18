interface SessionVO {
    "id": number;
    "username": string;
    "firstName": string;
    "lastName": string;
    "phoneNumber": string;
    "registered": Date;
    "diveCount": number;
    "payments": [];
    "approvedTerms": true;
    "language": string;
    "accessToken": string;
    "type": string;
    "roles": string[];
    "status": string;
    "expiresAt": Date;
}

export default SessionVO;