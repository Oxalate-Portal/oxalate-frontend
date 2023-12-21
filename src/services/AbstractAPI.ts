import Axios, {AxiosInstance} from "axios";
import authHeader from "../helpers/authHeader";

export abstract class AbstractAPI<T> {
    protected abstractAxios: AxiosInstance = Axios.create({headers: authHeader()});

    protected URLPREFIX: string = `${process.env.REACT_APP_API_URL}`;
    protected member: string;

    constructor(member: string) {
        this.member = member;
    }

    public async findById(id: number, parameters: string | null): Promise<T> {
        let url = this.URLPREFIX + this.member + "/" + id;
        url = parameters ? url + "?" + parameters : url;
        const response = await this.abstractAxios.get<T>(url);
        return response.data;
    }
}

