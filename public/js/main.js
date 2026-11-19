
/**
 * TERRITORY MANAGEMENT
 * Supabase database update handler
 */

window.updateTerritory = async function (data) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase is not initialized.");
        }

        const { data: updatedRecord, error } = await window.supabaseClient
            .from("territory_records")
            .update({
                last_completed: data.last_completed || null,
                assign_to: data.assign_to || null,
                date_assigned: data.date_assigned || null,
                date_completed: data.date_completed || null,
                updated_at: new Date().toISOString()
            })
            .eq("id", Number(data.id))
            .select()
            .single();

        if (error) {
            console.error("Update failed:", error);
            throw new Error(error.message || "Failed to update territory.");
        }

        return updatedRecord;

    } catch (error) {
        console.error("Territory update error:", error);
        throw error;
    }
};
