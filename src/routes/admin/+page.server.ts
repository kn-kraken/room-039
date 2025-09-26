import { authAdmin as auth } from "$lib/auth.server";
import { dbHelpers } from "$lib/db";
import type { Actions, PageServerLoad } from "./$types";

export const load = (async (event) => {
	const session = await auth(event);

	const reservations = dbHelpers.getPendingReservations();

	return {
		reservations,
		userData: session.userData,
	};
}) satisfies PageServerLoad;

export const actions = {
	confirm: async (event) => {
		const { userData } = await auth(event);
		const data = await event.request.formData();
		const id = data.get("id");
		if (id == null) {
			return;
		}
		dbHelpers.confirmReservation(userData.id, +id);
	},
	cancel: async (event) => {
		await auth(event);
		const data = await event.request.formData();
		const id = data.get("id");
		if (id == null) {
			return;
		}
		dbHelpers.cancelReservation(+id);
	},
	export: async (event) => {
		await auth(event);
		const data = await event.request.formData();
		const from = data.get("from");
		const to = data.get("to");
		if (from == null || to == null) {
			return;
		}
		const fromTime = new Date(from.toString());
		const toTime = new Date(to.toString());
		// karol shenaningans here
	},
	add_project: async (event) => {
		await auth(event);
		const data = await event.request.formData();
		const name = data.get("name");
		const emoji = data.get("emoji");
		if (name == null || emoji == null) {
			return;
		}
		dbHelpers.addProject(name.toString(), emoji.toString());
	},
} satisfies Actions;
