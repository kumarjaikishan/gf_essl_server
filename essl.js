const express = require('express');
const router = express.Router();

// ====================================================
// Database queries are bypassed / commented out
// This server strictly acts as a high-speed relay:
// forwards raw requests to remote server & returns 200 OK
// ====================================================

// Root / Health check from device
router.get('/', (req, res) => {
    console.log("➡️ GET / on ESSL relay");
    res.status(200).send('OK');
});

router.post('/', (req, res) => {
    console.log("➡️ POST / on ESSL relay");
    res.status(200).send('OK');
});

// Device handshake & server verification
router.get(['/iclock/cdata', '/iclock/cdata.aspx', '/essl/iclock/cdata', '/essl/iclock/cdata.aspx'], (req, res) => {
    console.log("➡️ GET iclock/cdata from SN:", req.query.SN || "N/A");
    res.status(200).send('OK');
});

// Device command polling
router.get(['/iclock/devicecmd', '/essl/iclock/devicecmd'], (req, res) => {
    console.log("➡️ GET iclock/devicecmd from SN:", req.query.SN || "N/A");
    res.status(200).send('OK');
});

// Device heartbeat / info request
router.get(['/iclock/getrequest.aspx', '/essl/iclock/getrequest.aspx'], (req, res) => {
    console.log("➡️ Heartbeat GET getrequest.aspx from SN:", req.query.SN || "N/A");
    res.status(200).send('OK');
});

// Device attendance data & operation logs (ATTLOG / USER / OPLOG)
router.post(['/iclock/cdata', '/iclock/cdata.aspx', '/essl/iclock/cdata', '/essl/iclock/cdata.aspx'], (req, res) => {
    const deviceSN = req.query.SN || "N/A";
    const raw = req.bodyRaw || '';

    if (raw.startsWith('USER')) {
        console.log(`👤 USER log received from SN: ${deviceSN}`);
    } else if (raw.startsWith('OPLOG')) {
        console.log(`📋 OPLOG log received from SN: ${deviceSN}`);
    } else if (/^\d+\s/.test(raw)) {
        console.log(`⏱️ ATTLOG Attendance log received from SN: ${deviceSN}`);
    } else {
        console.log(`📦 Data payload received from SN: ${deviceSN}`);
    }

    // Immediately reply with exact "OK" and HTTP 200
    res.status(200).send('OK');
});

module.exports = router;
