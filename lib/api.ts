const BASE_URL = 'https://supportive-expression-production-9bc9.up.railway.app';

async function request(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// EVENTS
export const getEvents = (categoria: string) =>
  request('GET', `/events?categoria=${encodeURIComponent(categoria)}&deleted=0`);

export const getAllEvents = () =>
  request('GET', `/events?deleted=0`);

export const getDeletedEvents = () =>
  request('GET', `/events?deleted=1`);

export const createEvent = (data: any) =>
  request('POST', '/events', data);

export const updateEvent = (id: string, data: any) =>
  request('PATCH', `/events/${id}`, data);

// PROYECTOS
export const getProyectos = () =>
  request('GET', '/proyectos');

export const createProyecto = (nombre: string) =>
  request('POST', '/proyectos', { nombre });

export const deleteProyecto = (id: string) =>
  request('DELETE', `/proyectos/${id}`);

// PASOS
export const getPasos = (proyecto_id: string) =>
  request('GET', `/pasos/${proyecto_id}`);

export const createPaso = (data: any) =>
  request('POST', '/pasos', data);

export const updatePaso = (id: string, data: any) =>
  request('PATCH', `/pasos/${id}`, data);

export const deletePaso = (id: string) =>
  request('DELETE', `/pasos/${id}`);

// CATEGORIAS
export const getCategorias = () =>
  request('GET', '/categorias');

export const createCategoria = (nombre: string) =>
  request('POST', '/categorias', { nombre });

// ANALYTICS
export const trackEvent = (event: string, meta: string = '') =>
  request('POST', '/analytics', { event, meta });

export const getAnalytics = () =>
  request('GET', '/analytics');