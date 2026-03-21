import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useEffect, useMemo, useState } from "react";
import { api, clearanceService } from '../../services';

type DeptStatus = {
  name: string;
  status: "pending" | "in_progress" | "not_started" | "approved" | "rejected" | "completed" | "officer_cleared" | "Pending" | "Approved" | "Rejected";
  updatedAt?: string;
  signatureUrl?: string;
  submittedAt?: string;
};

const LEFT_ORGS = [
  "IMC Coordinator",
  "Registrar",
  "Finance Officer",
  "College Student President",
  "Director, Student Development Office"
];
const RIGHT_ORGS = [
  "Homeroom Adviser",
  "Science Laboratory",
  "Guidance Counselor",
  "NSTP Coordinator",
  "AVRC"
];

export default function StudentClearanceSlip() {
  const [profile, setProfile] = useState<any>({});
  const [timeline, setTimeline] = useState<DeptStatus[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get("/student/profile");
        setProfile(p.data || {});
      } catch {
        try { setProfile(JSON.parse(localStorage.getItem("studentProfile") || "{}")); } catch { }
      }
      try {
        const res = await clearanceService.getMyClearances();
        setTimeline(res.organizations || []);
      } catch {
        setTimeline([]);
      }
    })();
  }, []);

  const getItem = (label: string) => {
    const lower = label.toLowerCase();
    return timeline.find(i => (i.name || "").toLowerCase() === lower);
  };

  const statusText = (label: string) => {
    const it = getItem(label);
    if (it?.status === "completed" || it?.status === "officer_cleared") {
      const dt = it.submittedAt ? String(new Date(it.submittedAt).toLocaleDateString()) : "";
      return `✔ Completed${dt ? ` (${dt})` : ""}`;
    }
    if (it?.status === "rejected") return "❗ Pending";
    return "❗ Pending";
  };

  const aySem = useMemo(() => {
    const sem = profile.semester || "2nd";
    const ay = profile.academicYear || "";
    return { sem, ay };
  }, [profile.semester, profile.academicYear]);

  const printSlip = () => { window.print(); };

  return (
    <Box p={4} sx={{ display: "flex", justifyContent: "center" }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #slip, #slip * { visibility: visible; }
          #slip { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <Box sx={{ width: "100%", maxWidth: 880 }}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button variant="outlined" onClick={printSlip}>Print</Button>
        </Box>
        <Box id="slip" sx={{ border: "1px solid #000", p: 3, fontFamily: "Times New Roman, Georgia, serif", backgroundColor: "#FFFFFF" }}>
          <Box display="grid" gridTemplateColumns="80px 1fr 80px" alignItems="center">
            <Box sx={{ width: 70, height: 70, border: "1px solid #000", borderRadius: 9999, justifySelf: "start" }}></Box>
            <Box textAlign="center">
              <Typography sx={{ fontWeight: 800 }}>SACRED HEART COLLEGE OF LUCENA CITY, INC.</Typography>
              <Typography sx={{ fontSize: 13 }}>1 Merchan Street, Lucena City</Typography>
              <Typography sx={{ fontSize: 13 }}>Contact Numbers: (042) 7103888 / (042) 7102505</Typography>
              <Typography sx={{ fontSize: 12 }}>Member: Daughters of Charity – St. Louise de Marillac Educational System (DCSLMES)</Typography>
            </Box>
            <Box sx={{ width: 70, height: 70, border: "1px solid #000", borderRadius: 8, justifySelf: "end" }}></Box>
          </Box>

          <Box mt={2} textAlign="center">
            <Typography sx={{ fontWeight: 800 }}>HIGHER EDUCATION ORGANIZATION</Typography>
            <Typography sx={{ fontWeight: 800 }}>STUDENT’S CLEARANCE SLIP</Typography>
            <Box mt={1} display="inline-flex" alignItems="center" gap={1}>
              <Typography sx={{ fontSize: 14 }}>2nd Semester, AY</Typography>
              <Box sx={{ minWidth: 180, borderBottom: "1px solid #000", lineHeight: 1.8 }}>
                <Typography sx={{ fontSize: 14 }}>{aySem.ay || ""}</Typography>
              </Box>
            </Box>
          </Box>

          <Box mt={2} display="grid" gridTemplateColumns="1fr 1fr 1fr" columnGap={2} rowGap={1}>
            <Box>
              <Typography sx={{ fontSize: 14 }}>FAMILY NAME</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 28 }}>
                <Typography sx={{ fontSize: 16 }}>{profile.familyName || ""}</Typography>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14 }}>FIRST NAME</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 28 }}>
                <Typography sx={{ fontSize: 16 }}>{profile.firstName || ""}</Typography>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14 }}>MIDDLE NAME</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 28 }}>
                <Typography sx={{ fontSize: 16 }}>{profile.middleName || ""}</Typography>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 14 }}>STUDENT NUMBER</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 28 }}>
                <Typography sx={{ fontSize: 16 }}>{profile.studentNumber || ""}</Typography>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14 }}>COURSE</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 28 }}>
                <Typography sx={{ fontSize: 16 }}>{profile.course || ""}</Typography>
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14 }}>YEAR</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 28 }}>
                <Typography sx={{ fontSize: 16 }}>{profile.year || ""}</Typography>
              </Box>
            </Box>
          </Box>

          <Box mt={2} display="grid" gridTemplateColumns="1fr 1fr" columnGap={4}>
            <Box>
              {LEFT_ORGS.map((label) => {
                const it = getItem(label);
                return (
                <Box key={label} display="grid" gridTemplateColumns="1fr 1fr" alignItems="center" sx={{ py: 0.5 }}>
                  <Typography sx={{ fontSize: 14 }}>{label}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, borderBottom: "1px solid #000", minHeight: 24, position: "relative" }}>
                      {it?.signatureUrl && (
                        <img 
                          src={it.signatureUrl} 
                          alt="Signature" 
                          style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", maxHeight: "45px", maxWidth: "100%" }} 
                        />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 12 }}>{statusText(label)}</Typography>
                  </Box>
                </Box>
                );
              })}
            </Box>
            <Box>
              {RIGHT_ORGS.map((label) => {
                const it = getItem(label);
                return (
                <Box key={label} display="grid" gridTemplateColumns="1fr 1fr" alignItems="center" sx={{ py: 0.5 }}>
                  <Typography sx={{ fontSize: 14 }}>{label}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ flex: 1, borderBottom: "1px solid #000", minHeight: 24, position: "relative" }}>
                      {it?.signatureUrl && (
                        <img 
                          src={it.signatureUrl} 
                          alt="Signature" 
                          style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", maxHeight: "45px", maxWidth: "100%" }} 
                        />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: 12 }}>{statusText(label)}</Typography>
                  </Box>
                </Box>
                );
              })}
            </Box>
          </Box>

          <Box mt={2}>
            <Typography sx={{ fontSize: 12 }}>Requirements for clearance for the Student Development Office:</Typography>
            <Box sx={{ pl: 2 }}>
              <Typography sx={{ fontSize: 12 }}>1. Valid I.D.</Typography>
              <Typography sx={{ fontSize: 12 }}>2. Signature of Homeroom Adviser</Typography>
              <Typography sx={{ fontSize: 12 }}>3. Duly accomplished College Organization form signed by the Organizational President and Moderator</Typography>
            </Box>
          </Box>

          <Box mt={3}>
            <Box textAlign="center">
              <Typography sx={{ fontSize: 14 }}>This is to certify that</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 24, display: "inline-block", minWidth: 260 }}>
                <Typography sx={{ fontSize: 16 }}>{`${profile.firstName || ""} ${profile.familyName || ""}`.trim()}</Typography>
              </Box>
              <Typography sx={{ fontSize: 14 }}>is cleared of any responsibility from the College of</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 24, display: "inline-block", minWidth: 260 }}>
                <Typography sx={{ fontSize: 16 }}>{profile.course || ""}</Typography>
              </Box>
              <Typography sx={{ fontSize: 14 }}>for the</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 24, display: "inline-block", minWidth: 100 }}>
                <Typography sx={{ fontSize: 16 }}>{aySem.sem || ""}</Typography>
              </Box>
              <Typography sx={{ fontSize: 14 }}>, Academic Year</Typography>
              <Box sx={{ borderBottom: "1px solid #000", minHeight: 24, display: "inline-block", minWidth: 140 }}>
                <Typography sx={{ fontSize: 16 }}>{aySem.ay || ""}</Typography>
              </Box>
            </Box>

            <Box mt={3} display="grid" gridTemplateColumns="1fr 200px" alignItems="center">
              <Box></Box>
              <Box>
                <Box sx={{ borderBottom: "1px solid #000", minHeight: 24 }} />
                <Typography sx={{ fontSize: 13, textAlign: "center", mt: 0.5 }}>College Dean</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
