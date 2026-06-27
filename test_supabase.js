"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var supabase = (0, supabase_js_1.createClient)("https://tqmkivmfjarmgqihvbtm.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbWtpdm1mamFybWdxaWh2YnRtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ5MTE1NiwiZXhwIjoyMDkxMDY3MTU2fQ.9ICAi4Dbz0v8d7wPS6-51dFl3cN0hKE8i7mnrFj8Ib4");
function test() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, users, userErr, userId, _b, txs, txErr, txId, _c, data, error;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, supabase.auth.admin.listUsers()];
                case 1:
                    _a = _d.sent(), users = _a.data, userErr = _a.error;
                    if (userErr) {
                        console.error("Auth error:", userErr);
                        return [2 /*return*/];
                    }
                    userId = users.users[0].id;
                    console.log("Testing for user:", userId);
                    return [4 /*yield*/, supabase.from("transactions").select("*").eq("user_id", userId).limit(1)];
                case 2:
                    _b = _d.sent(), txs = _b.data, txErr = _b.error;
                    if (txErr || !txs.length) {
                        console.error("Tx err:", txErr);
                        return [2 /*return*/];
                    }
                    txId = txs[0].id;
                    console.log("Testing tx:", txId, txs[0].name);
                    // Assign Category Logic (Simulate)
                    console.log("Updating tx...");
                    return [4 /*yield*/, supabase.from("transactions").update({
                            category: "Food & Dining",
                            needs_review: false,
                            suggested_category: null,
                        }).eq("id", txId).select().single()];
                case 3:
                    _c = _d.sent(), data = _c.data, error = _c.error;
                    if (error) {
                        console.error("Assign Error:", error);
                    }
                    else {
                        console.log("Assign Success:", data);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
test();
