import api from "@/lib/api";
import { InventoryItem, Warehouse } from "@/types/stock";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useWarehouses = () => useQuery({
    queryKey: ['warehouses'],
    queryFn:()=> api.get<Warehouse[]>('/warehouses').then(res => res.data)

});

export const useWarehouseStock = (warehouseId:number) => useQuery({
    queryKey: ['warehouses', warehouseId,'stock'],
    queryFn:() =>api.get<InventoryItem[]>(`/warehouses/${warehouseId}/stock`).then(res => res.data),
    enabled: !!warehouseId, });

export const useCreateWarehouse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:(data:Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data).then(res => res.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
        },
    });
};

export const useWarehouseSummary = () =>
  useQuery({ queryKey: ['warehouses', 'summary'], queryFn: () => api.get('/warehouses/summary').then(r => r.data) });