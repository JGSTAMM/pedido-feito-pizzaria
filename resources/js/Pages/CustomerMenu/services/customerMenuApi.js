import axios from 'axios';

const DIGITAL_MENU_ENDPOINT = '/api/digital-menu';

export async function fetchDigitalCatalog() {
    const response = await axios.get(DIGITAL_MENU_ENDPOINT);
    return response.data;
}
