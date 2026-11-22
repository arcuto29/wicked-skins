package com.priism.skins

import android.content.Context
import org.json.JSONObject

/** Settings as one JSON object, persisted in SharedPreferences. Mirrors the desktop app's settings.json. */
class Store(ctx: Context) {
    private val prefs = ctx.getSharedPreferences("priism", Context.MODE_PRIVATE)

    fun json(): String = prefs.getString("cfg", "{}") ?: "{}"

    /** Shallow-merge an incoming JSON object into the stored cfg. */
    fun merge(incoming: String) {
        val cur = JSONObject(json())
        val add = JSONObject(incoming)
        for (k in add.keys()) cur.put(k, add.get(k))
        prefs.edit().putString("cfg", cur.toString()).apply()
    }

    /** Remove keys (settings upgrades, undoing a restored backup). */
    fun remove(keysJson: String) {
        val cur = JSONObject(json())
        val keys = org.json.JSONArray(keysJson)
        for (i in 0 until keys.length()) cur.remove(keys.optString(i))
        prefs.edit().putString("cfg", cur.toString()).apply()
    }
}
