import Axios, {AxiosInstance} from "axios";
import authHeader from "../helpers/authHeader";

export abstract class AbstractAPI<T> {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${process.env.REACT_APP_API_URL}` + member,
            headers: authHeader()
        });
    }

    public async findById(id: number, parameters: string | null): Promise<T> {
        let url = "/" + id;
        url = parameters ? url + "?" + parameters : url;
        console.log("URL: " + url);
        // console.log("Arguments:", this.abstractAxios.arguments);
        const response = await this.axiosInstance.get<T>(url);
        return response.data;
    }

    public async create(payload: T): Promise<T> {
        const response = await this.axiosInstance.post<T>("", payload);
        return response.data;
    }

    public async update(payload: T): Promise<T> {
        const response = await this.axiosInstance.put<T>("", payload);
        return response.data;
    }

    public async delete(id: number): Promise<void> {
           const response = await this.axiosInstance.delete<T>("/" + id);
    }
}

