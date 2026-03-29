import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import { useTheme, useMediaQuery, Divider, Skeleton } from "@mui/material";

const FAQ_DATA = {
  general: [
    {
      question: "How do I perform a final approval?",
      answer: "Navigate to the 'Final Clearances' dashboard. Locate the student you want to approve, and click the 'Sign' icon in the actions column. This will open the signature modal where you can apply your official signature."
    },
    {
      question: "Can I approve students in bulk?",
      answer: "Yes, you can use the 'Approve All' button in the top right of the Final Clearances dashboard to approve all currently pending students at once. Ensure you have reviewed the list before using this action."
    },
    {
      question: "Why can't I see some students in my list?",
      answer: "Students only appear in the Final Clearances list once all their organization-level requirements have been cleared. If a student is missing, they likely have pending requirements from specific organizations."
    }
  ],
  security: [
    {
      question: "How do I update my official signature?",
      answer: "Go to 'Settings' via the sidebar. You can either draw your signature directly on the canvas or upload a high-quality image of your signature. This signature will be applied to all clearance forms you approve."
    },
    {
      question: "Is my digital signature secure?",
      answer: "Yes, signatures are stored securely and are only applied to documents when you explicitly confirm an approval action."
    }
  ],
  features: [
    {
      question: "How do I filter students by course?",
      answer: "On the dashboard, you can use the 'Course' dropdown filter or click the 'All Students' card to select a specific course. This helps you manage large batches of students more effectively."
    },
    {
      question: "What are 'Organization Approvals'?",
      answer: "Organization Approvals are pre-dean requirements. You can monitor these in the 'Organization Approvals' tab to see which students are making progress and which organizations are currently reviewing them."
    }
  ]
};

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "security", label: "Account & security" },
  { id: "features", label: "Features & tools" }
];

const fontStack = "'Inter', 'Plus Jakarta Sans', sans-serif";

export default function DeanFAQPage() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [expanded, setExpanded] = useState<string | false>("panel0");
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(() => {
    setIsLoading(true);

    // Since data is static, "loading" is near-instant.
    // We implement a minimum 1000ms delay as requested for a premium feel.
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeCategory]);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const ContentSkeleton = () => (
    <Box flex={1}>
      <Box mb={1}>
        <Skeleton variant="text" width={60} height={20} />
      </Box>

      <Box mb={6}>
        <Skeleton variant="text" width="70%" height={isMobile ? 45 : 60} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={isMobile ? 45 : 60} />
      </Box>

      <Box>
        {[1, 2, 3].map((i) => (
          <Box key={i} mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" py={2}>
              <Skeleton variant="text" width="60%" height={30} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
            <Divider sx={{ borderColor: '#F1F5F9' }} />
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, ml: 0, pt: 4, pb: 8, pl: isMobile ? 2 : 0, pr: isMobile ? 2 : 6 }}>
      <Box display="flex" flexDirection={isMobile ? "column" : "row"} gap={isMobile ? 4 : 20}>

        {/* Sidebar Nav */}
        <Box sx={{ width: isMobile ? "100%" : 240, flexShrink: 0 }}>
          <motion.div layout>
            <Box display="flex" flexDirection={isMobile ? "row" : "column"} gap={1} sx={{ overflowX: isMobile ? 'auto' : 'visible' }}>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <Box
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    sx={{
                      position: 'relative',
                      px: 3,
                      py: 1.5,
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: isActive ? "#0E7490" : "#64748B",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.95rem",
                      transition: "color 0.2s ease",
                      whiteSpace: "nowrap",
                      zIndex: 1, // Base stacking context
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryIndicator"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(176, 224, 230, 0.2)",
                          borderRadius: "8px",
                          zIndex: 0
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0.15,
                          duration: 0.5
                        }}
                      />
                    )}
                    <motion.span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'block',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.95rem"
                      }}
                      animate={{ color: isActive ? "#0E7490" : "#64748B" }}
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    >
                      {cat.label}
                    </motion.span>
                  </Box>
                );
              })}
            </Box>
          </motion.div>
        </Box>

        {/* Content Area */}
        {isLoading ? (
          <ContentSkeleton />
        ) : (
          <Box flex={1}>
            {/* Badge */}
            <Box mb={2}>
              <Typography sx={{
                display: 'inline-block',
                bgcolor: "#fef08a",
                color: "#854d0e",
                px: 1.5,
                py: 0.5,
                borderRadius: '6px',
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.05em"
              }}>
                / FAQS
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: isMobile ? "2.5rem" : "3.5rem",
                color: "#0F172A",
                fontFamily: fontStack,
                lineHeight: 1.1,
                mb: 6,
                letterSpacing: '-0.04em'
              }}
            >
              Frequently asked<br />question
            </Typography>

            <Box>
              {(FAQ_DATA[activeCategory as keyof typeof FAQ_DATA] || []).map((faq, index) => {
                const panelId = `panel${index}`;
                const isExpanded = expanded === panelId;

                return (
                  <Box key={index}>
                    <Accordion
                      expanded={isExpanded}
                      onChange={handleChange(panelId)}
                      disableGutters
                      elevation={0}
                      sx={{
                        backgroundColor: "transparent",
                        "&:before": { display: "none" },
                        py: 1
                      }}
                    >
                      <AccordionSummary
                        expandIcon={
                          <Box sx={{ fontSize: '24px', fontWeight: 400, color: '#0F172A', transition: 'all 0.2s' }}>
                            {isExpanded ? "−" : "+"}
                          </Box>
                        }
                        sx={{
                          px: 0,
                          "& .MuiAccordionSummary-content": { my: 2 },
                          "& .MuiAccordionSummary-expandIconWrapper": { transform: 'none' }
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, color: "#1E293B", fontSize: "1.25rem", fontFamily: fontStack }}>
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0, pb: 4, pt: 0 }}>
                        <Typography sx={{ color: "#64748B", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: 700, fontFamily: fontStack }}>
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                    <Divider sx={{ borderColor: '#F1F5F9' }} />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
