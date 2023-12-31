import axios from "axios";
import {PageGroupResponse} from "../models/responses";

class NavigationAPI {

    async getNavigationItems(language: string): Promise<PageGroupResponse[]|void> {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/pages/navigation-elements?language=${language}`);

        if (response.status === 200 && response.data.length > 0) {
            console.info("Received navigation pages:", response.data);
            return response.data;
        } else {
            if (response.status !== 200) {
                console.info("The response status was " + response.status + ": " + JSON.stringify(response));
            } else {
                console.info("The response did not contain data.token: " + JSON.stringify(response));
            }
        }
    }
}

export const navigationAPI = new NavigationAPI();
