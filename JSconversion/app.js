"use strict";
// src/app.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const express_session_1 = __importDefault(require("express-session"));
const connect_mongodb_session_1 = __importDefault(require("connect-mongodb-session"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const registrationRoutes_1 = __importDefault(require("./routes/registrationRoutes"));
const app = (0, express_1.default)();
const MongoDBStore = (0, connect_mongodb_session_1.default)(express_session_1.default);
const MONGODB_URI = 'mongodb://127.0.0.1:27017/Courses';
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
});
store.on('error', (error) => {
    console.error('Session store error:', error);
});
app.use(body_parser_1.default.json());
app.use((0, express_session_1.default)({
    secret: 'This is my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
}));
// Route Middlewares
app.use('/', courseRoutes_1.default); // POST /add/courseOffering
app.use('/', registrationRoutes_1.default); // POST /add/register/:course_id
// POST /cancel/:registration_id
// Start server after MongoDB connection
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('MongoDB connected');
    app.listen(7070, () => console.log('Server running on port 7070'));
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
//# sourceMappingURL=app.js.map