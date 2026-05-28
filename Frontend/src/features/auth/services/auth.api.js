import API from "../../../services/api";

export async function register({ username, email, password }) {
    try {
        const response = await API.post('/api/auth/register', {
            username,
            email,
            password
        });

        return response.data;

    } catch (err) {
        console.log(err);
        throw err;
    }
}

export async function login({ email, password }) {
    try {
        const response = await API.post("/api/auth/login", {
            email,
            password
        });

        return response.data;

    } catch (err) {
        console.log(err);
        throw err;
    }
}

export async function logout() {
    try {
        const response = await API.get("/api/auth/logout");
        return response.data;

    } catch (err) {
        console.log(err);
        throw err;
    }
}

export async function getMe() {
    try {
        const response = await API.get("/api/auth/get-me");
        return response.data;

    } catch (err) {
        console.log(err);
        throw err;
    }
}