
/**
 * TERRITORY MANAGEMENT
 * Supabase database update handler
 */


window.updateTerritory = async function (data) {
    try {
        if (!window.supabaseClient) {
            throw new Error("Supabase is not initialized.");
        }

        const updateData = {
            last_completed: data.last_completed || null,

            // First assignment
            assign_to: data.assign_to || null,
            date_assigned: data.date_assigned || null,
            date_completed: data.date_completed || null,

            // Second assignment
            assign_to_2: data.assign_to_2 || null,
            date_assigned_2: data.date_assigned_2 || null,
            date_completed_2: data.date_completed_2 || null,

            // Third assignment
            assign_to_3: data.assign_to_3 || null,
            date_assigned_3: data.date_assigned_3 || null,
            date_completed_3: data.date_completed_3 || null,

            updated_at: new Date().toISOString()
        };

        const { data: updatedRecord, error } =
            await window.supabaseClient
                .from("territory_records")
                .update(updateData)
                .eq("id", Number(data.id))
                .select()
                .single();

        if (error) {
            console.error("Update failed:", error);
            throw new Error(
                error.message || "Failed to update territory."
            );
        }

        return updatedRecord;

    } catch (error) {
        console.error("Territory update error:", error);
        throw error;
    }
};

