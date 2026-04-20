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

const fontStack = '"Google Sans", "Product Sans", Roboto, sans-serif';

export default function DeanFAQPage() {
  const [activeCategory, setActiveCategory] = useState("general");
  const [expanded, setExpanded] = useState<string | false>("panel0");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Loading state effect - runs once on mount
  React.useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setIsInitialLoad(false);
      }, 1000); // Reduced to 1s for better balance
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  // Chatbot effect - runs only once on mount
  React.useEffect(() => {
    // Inject Tuqlas Chatbot Script
    const script = document.createElement("script");
    script.src = "https://www.tuqlas.com/chatbot.js";
    script.setAttribute("data-key", "tq_live_7ed1635c2379892b8a8b8581ed143f0b88e2cab8");
    script.setAttribute("data-api", "https://www.tuqlas.com");
    script.defer = true;
    document.body.appendChild(script);

    // Initial style injection
    const style = document.createElement("style");
    style.id = "tuqlas-position-fix-dean";
    style.innerHTML = `
      #tuqlas-container, .tq-chatbot-container, [id^="tq-chatbot"], iframe[src*="tuqlas.com"] {
        bottom: 100px !important;
      }
    `;
    document.head.appendChild(style);

    // Aggressive positioning check to fight script overrides
    const forcePosition = () => {
      const selectors = ['#tuqlas-container', '.tq-chatbot-container', '[id^="tq-chatbot"]', 'iframe[src*="tuqlas.com"]'];
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          (el as HTMLElement).style.setProperty('bottom', '100px', 'important');
        });
      });
    };
    const positionInterval = setInterval(forcePosition, 1000);

    return () => {
      clearInterval(positionInterval);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      const existingStyle = document.getElementById("tuqlas-position-fix-dean");
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }

      // Robust cleanup: Remove Tuqlas injected DOM elements (iframes, containers, bubbles, etc.)
      const selectors = [
        '#tuqlas-container',
        '.tq-chatbot-container',
        '[id^="tq-chatbot"]',
        'iframe[src*="tuqlas.com"]',
        '.tq-bubble',
        '.tq-launcher',
        '[class*="tuqlas"]',
        '[id*="tuqlas"]'
      ];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
    };
  }, []);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const ContentSkeleton = () => (
    <Box flex={1}>
      {/* Badge Skeleton */}
      <Box mb={2}>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '6px', bgcolor: "#eaebec" }} />
      </Box>

      {/* Title Skeleton */}
      <Box mb={6}>
        <Skeleton variant="text" width="80%" height={isMobile ? 50 : 80} sx={{ bgcolor: "#eaebec" }} />
        <Skeleton variant="text" width="60%" height={isMobile ? 50 : 80} sx={{ bgcolor: "#eaebec" }} />
      </Box>

      {/* FAQ Items Skeleton */}
      <Box>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Skeleton variant="text" width="60%" height={30} sx={{ bgcolor: "#eaebec" }} />
              <Skeleton variant="text" width="20px" height={30} sx={{ bgcolor: "#eaebec" }} />
            </Box>
            <Divider sx={{ borderColor: '#eaebec' }} />
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
                      borderRadius: "12px",
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
                          backgroundColor: "rgba(45, 212, 191, 0.15)",
                          backdropFilter: "blur(4px)",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(13, 148, 136, 0.08)",
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
                bgcolor: "rgba(45, 212, 191, 0.15)",
                color: "#0E7490",
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
