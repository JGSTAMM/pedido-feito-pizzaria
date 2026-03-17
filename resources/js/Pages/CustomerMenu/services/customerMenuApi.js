import axios from 'axios';

const DIGITAL_MENU_ENDPOINT = '/api/digital-menu';
const ONLINE_ORDER_ENDPOINT = '/api/online-orders';

export async function fetchDigitalCatalog() {
    const response = await axios.get(DIGITAL_MENU_ENDPOINT);
    return response.data;
}

export async function submitOrder(payload) {
    const response = await axios.post(ONLINE_ORDER_ENDPOINT, payload);
    return response.data;
}
