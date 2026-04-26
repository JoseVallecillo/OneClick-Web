import { type BreadcrumbItem } from '@/types';
import { Head,  router, useForm  } from '@inertiajs/react';
import { Camera, MapPin, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const BUSINESS_TYPES = ['pulperia','taller','costura','venta_ropa','agricultura','servicios','transporte','manufactura','comercio','otro'];

interface Props { client?: any; isEdit?: boolean }

const inp = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full rounded border px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black ${props.className ?? ''}`} />
);
const field = (label: string, el: React.ReactNode) => (
    <div><label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>{el}</div>
);

const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Microfinanzas', href: '/microfinance' },
        { title: 'Clientes', href: '/microfinance/clients' },
        { title: isEdit ? 'Editar' : 'Nuevo cliente', href: '#' },
    ];

export default function ClientForm({ client, isEdit = false }: Props) {

    const { data, setData, post, patch, processing, errors } = useForm({
        first_name: client?.first_name ?? '',
        last_name: client?.last_name ?? '',
        identity_number: client?.identity_number ?? '',
        birth_date: client?.birth_date ?? '',
        gender: client?.gender ?? 'M',
        phone_mobile: client?.phone_mobile ?? '',
        phone_whatsapp: client?.phone_whatsapp ?? '',
        email: client?.email ?? '',
        address: client?.address ?? '',
        latitude: client?.latitude ?? '',
        longitude: client?.longitude ?? '',
        business_name: client?.business_name ?? '',
        business_type: client?.business_type ?? '',
        business_years: client?.business_years ?? '',
        monthly_revenue: client?.monthly_revenue ?? '',
        monthly_expenses: client?.monthly_expenses ?? '',
        monthly_payment_capacity: client?.monthly_payment_capacity ?? '',
        notes: client?.notes ?? '',
    });

    const [locating, setLocating] = useState(false);

    const getLocation = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setData(d => ({ ...d, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
                setLocating(false);
            },
            () => setLocating(false)
        );
    };

    const netIncome = (Number(data.monthly_revenue) - Number(data.monthly_expenses)).toFixed(2);
    const capacityRatio = data.monthly_payment_capacity && Number(netIncome) > 0
        ? (Number(data.monthly_payment_capacity) / Number(netIncome) * 100).toFixed(0) : null;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) patch(`/microfinance/clients/${client.id}`);
        else post('/microfinance/clients');
    };

    return (
        <>
            <Head title="Microfinanzas" />
            <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5 p-4">
                <h1 className="text-xl font-semibold">{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h1>

                {/* Personal */}
                <div className="rounded-lg border bg-white p-4">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700">Datos personales</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {field('Nombres *', inp({ value: data.first_name, onChange: e => setData('first_name', e.target.value), required: true }))}
                        {field('Apellidos *', inp({ value: data.last_name, onChange: e => setData('last_name', e.target.value), required: true }))}
                        {field('DNI / Identidad *', inp({ value: data.identity_number, onChange: e => setData('identity_number', e.target.value), required: true, placeholder: '0000-0000-00000' }))}
                        {field('Fecha nacimiento', inp({ type: 'date', value: data.birth_date, onChange: e => setData('birth_date', e.target.value) }))}
                        {field('Celular', inp({ value: data.phone_mobile, onChange: e => setData('phone_mobile', e.target.value), placeholder: '+504 0000-0000' }))}
                        {field('WhatsApp', inp({ value: data.phone_whatsapp, onChange: e => setData('phone_whatsapp', e.target.value) }))}
                        <div className="col-span-2">{field('Dirección', inp({ value: data.address, onChange: e => setData('address', e.target.value) }))}</div>
                    </div>
                    {/* Geolocation */}
                    <div className="mt-3 flex items-center gap-3">
                        <button type="button" onClick={getLocation} disabled={locating}
                            className="flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">
                            <MapPin className="h-4 w-4" />{locating ? 'Obteniendo...' : 'Capturar GPS'}
                        </button>
                        {data.latitude && data.longitude && (
                            <span className="text-xs text-green-600">✓ {Number(data.latitude).toFixed(5)}, {Number(data.longitude).toFixed(5)}</span>
                        )}
                    </div>
                </div>

                {/* Business */}
                <div className="rounded-lg border bg-white p-4">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700">Negocio / Unidad económica</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {field('Nombre del negocio', inp({ value: data.business_name, onChange: e => setData('business_name', e.target.value) }))}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">Tipo de negocio</label>
                            <select value={data.business_type} onChange={e => setData('business_type', e.target.value)}
                                className="w-full rounded border px-3 py-1.5 text-sm">
                                <option value="">Seleccionar...</option>
                                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        {field('Años en operación', inp({ type: 'number', min: '0', value: data.business_years, onChange: e => setData('business_years', e.target.value) }))}
                        {field('Ingresos mensuales (L.)', inp({ type: 'number', step: '0.01', value: data.monthly_revenue, onChange: e => setData('monthly_revenue', e.target.value) }))}
                        {field('Gastos mensuales (L.)', inp({ type: 'number', step: '0.01', value: data.monthly_expenses, onChange: e => setData('monthly_expenses', e.target.value) }))}
                        {field('Capacidad de pago (L.)', inp({ type: 'number', step: '0.01', value: data.monthly_payment_capacity, onChange: e => setData('monthly_payment_capacity', e.target.value) }))}
                    </div>
                    {Number(data.monthly_revenue) > 0 && (
                        <div className="mt-3 rounded border bg-blue-50 p-3 text-xs">
                            <span className="text-gray-500">Ingreso neto estimado: </span>
                            <strong>L.{Number(netIncome).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</strong>
                            {capacityRatio && <span className="ml-3 text-gray-500">Relación pago/ingreso: <strong>{capacityRatio}%</strong></span>}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => router.visit('/microfinance/clients')}
                        className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                    <button type="submit" disabled={processing}
                        className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50">
                        {isEdit ? 'Guardar cambios' : 'Registrar cliente'}
                    </button>
                </div>
            </form>
        </>
    );
}

ClientForm.layout = { breadcrumbs };
