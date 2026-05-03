// src/main/java/com/jobera/service/UniversalResumeParserService.java
package com.jobera.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class UniversalResumeParserService {

    // ========== UNIVERSAL SKILLS DATABASE (ALL FIELDS) ==========
    private static final Map<String, Set<String>> SKILLS_BY_DOMAIN = new HashMap<>();
    
    static {
        // IT & SOFTWARE DEVELOPMENT
        SKILLS_BY_DOMAIN.put("IT & Software", new HashSet<>(Arrays.asList(
            "java", "python", "javascript", "typescript", "c++", "c#", "ruby", "php",
            "react", "angular", "vue", "node.js", "spring boot", "django", "flask",
            "mysql", "postgresql", "mongodb", "redis", "aws", "azure", "gcp",
            "docker", "kubernetes", "jenkins", "git", "html", "css", "sass",
            "machine learning", "deep learning", "tensorflow", "pytorch", "pandas",
            "data science", "nlp", "computer vision", "android", "ios", "flutter",
            "graphql", "rest api", "microservices", "agile", "scrum", "jira"
        )));
        
        // MECHANICAL ENGINEERING
        SKILLS_BY_DOMAIN.put("Mechanical Engineering", new HashSet<>(Arrays.asList(
            "autocad", "solidworks", "catia", "creo", "nx", "ansys", "abaqus",
            "finite element analysis", "fea", "computational fluid dynamics", "cfd",
            "thermodynamics", "heat transfer", "fluid mechanics", "machine design",
            "manufacturing", "gd&t", "cam", "cnc", "3d printing", "additive manufacturing",
            "plm", "pdm", "product design", "mechatronics", "robotics", "hydraulics",
            "pneumatics", "material science", "metallurgy", "quality control", "six sigma",
            "lean manufacturing", "kaizen", "5s", "iso", "asme", "astm"
        )));
        
        // CIVIL ENGINEERING
        SKILLS_BY_DOMAIN.put("Civil Engineering", new HashSet<>(Arrays.asList(
            "autocad", "revit", "staad pro", "etabs", "sap2000", "primavea", "ms project",
            "structural analysis", "construction management", "project management",
            "bim", "building information modeling", "surveying", "geotechnical engineering",
            "transportation engineering", "environmental engineering", "water resources",
            "hydrology", "municipal engineering", "urban planning", "quantity surveying",
            "cost estimation", "contract management", "safety management", "osha",
            "iso 9001", "lean construction", "green building", "leed", "gis", "arcgis"
        )));
        
        // ELECTRICAL ENGINEERING
        SKILLS_BY_DOMAIN.put("Electrical Engineering", new HashSet<>(Arrays.asList(
            "matlab", "simulink", "labview", "autocad electrical", "etap", "pscad",
            "circuit design", "power systems", "control systems", "embedded systems",
            "plc programming", "scada", "arduino", "raspberry pi", "iot", "vlsi",
            "digital signal processing", "dsp", "renewable energy", "solar", "wind",
            "power electronics", "motor control", "hvac", "lighting design", "iec",
            "nec", "national electric code", "electrical safety", "switchgear",
            "transformers", "generators", "distribution systems"
        )));
        
        // ELECTRONICS ENGINEERING
        SKILLS_BY_DOMAIN.put("Electronics Engineering", new HashSet<>(Arrays.asList(
            "vlsi", "embedded systems", "arduino", "raspberry pi", "pcb design",
            "altium", "orcad", "eagle", "spice", "microcontrollers", "fpga", "verilog",
            "vhdl", "digital design", "analog design", "signal processing", "iot",
            "wireless", "rf", "antenna design", "communication systems", "telecommunication",
            "optical fiber", "sensors", "actuators", "embedded c", "arm", "avr", "pic"
        )));
        
        // CHEMICAL ENGINEERING
        SKILLS_BY_DOMAIN.put("Chemical Engineering", new HashSet<>(Arrays.asList(
            "process engineering", "chemical process", "aspen plus", "hysys", "comsol",
            "mass transfer", "heat transfer", "fluid dynamics", "thermodynamics",
            "reaction engineering", "separation processes", "distillation", "filtration",
            "crystallization", "extraction", "adsorption", "membrane technology",
            "process control", "instrumentation", "piping", "p&id", "hazop", "hazid",
            "safety engineering", "environmental engineering", "waste treatment",
            "water treatment", "petrochemical", "pharmaceutical", "biotechnology"
        )));
        
        // MEDICAL & HEALTHCARE
        SKILLS_BY_DOMAIN.put("Medical & Healthcare", new HashSet<>(Arrays.asList(
            "patient care", "medical terminology", "electronic health records", "ehr",
            "healthcare management", "clinical research", "pharmacy", "nursing",
            "medical coding", "icd-10", "cpt", "hcpcs", "cpr", "first aid", "bls",
            "acls", "pals", "medical billing", "health informatics", "telemedicine",
            "medical devices", "radiology", "diagnostic imaging", "laboratory",
            "pathology", "microbiology", "anatomy", "physiology", "pharmacology"
        )));
        
        // FINANCE & ACCOUNTING
        SKILLS_BY_DOMAIN.put("Finance & Accounting", new HashSet<>(Arrays.asList(
            "financial analysis", "financial modeling", "accounting", "bookkeeping",
            "taxation", "auditing", "budgeting", "forecasting", "investment analysis",
            "risk management", "quickbooks", "sap fico", "oracle financials", "ifrs",
            "gaap", "cfa", "cpa", "cma", "acca", "financial reporting", "internal audit",
            "compliance", "regulatory reporting", "treasury management", "cash flow",
            "balance sheet", "profit and loss", "financial statements", "microsoft excel"
        )));
        
        // MARKETING & SALES
        SKILLS_BY_DOMAIN.put("Marketing & Sales", new HashSet<>(Arrays.asList(
            "digital marketing", "seo", "sem", "social media marketing", "content marketing",
            "email marketing", "market research", "sales strategy", "customer relationship management",
            "crm", "salesforce", "hubspot", "google analytics", "brand management",
            "public relations", "advertising", "market analysis", "lead generation",
            "sales forecasting", "pricing strategy", "product marketing", "b2b", "b2c",
            "google ads", "facebook ads", "linkedin ads", "instagram marketing"
        )));
        
        // HUMAN RESOURCES
        SKILLS_BY_DOMAIN.put("Human Resources", new HashSet<>(Arrays.asList(
            "recruitment", "talent acquisition", "employee relations", "performance management",
            "training and development", "compensation and benefits", "hr policies",
            "labor laws", "onboarding", "succession planning", "hr analytics",
            "workday", "sap hcm", "people soft", "hrms", "payroll", "attendance management",
            "employee engagement", "hr compliance", "statutory compliance", "industrial relations"
        )));
        
        // EDUCATION & TEACHING
        SKILLS_BY_DOMAIN.put("Education & Teaching", new HashSet<>(Arrays.asList(
            "curriculum development", "lesson planning", "classroom management",
            "student assessment", "educational technology", "e-learning", "moodle",
            "blackboard", "canvas", "special education", "teacher training",
            "academic counseling", "instructional design", "pedagogy", "andragogy",
            "educational psychology", "assessment design", "educational leadership"
        )));
        
        // DESIGN & CREATIVE
        SKILLS_BY_DOMAIN.put("Design & Creative", new HashSet<>(Arrays.asList(
            "ui design", "ux design", "user research", "wireframing", "prototyping",
            "adobe photoshop", "adobe illustrator", "adobe indesign", "figma",
            "sketch", "adobe xd", "graphic design", "web design", "motion graphics",
            "video editing", "adobe premiere", "after effects", "3d modeling", "blender",
            "cinema 4d", "maya", "3ds max", "typography", "color theory", "branding"
        )));
        
        // LOGISTICS & SUPPLY CHAIN
        SKILLS_BY_DOMAIN.put("Logistics & Supply Chain", new HashSet<>(Arrays.asList(
            "supply chain management", "logistics", "inventory management", "warehouse management",
            "transportation", "distribution", "procurement", "purchasing", "vendor management",
            "demand planning", "supply planning", "sap scm", "oracle scm", "wms", "tms",
            "forecasting", "sourcing", "strategic sourcing", "contract negotiation"
        )));
        
        // HOSPITALITY
        SKILLS_BY_DOMAIN.put("Hospitality", new HashSet<>(Arrays.asList(
            "hotel management", "restaurant management", "customer service",
            "event planning", "tourism", "hospitality management", "front office",
            "housekeeping", "food and beverage", "banquet management", "reservation systems",
            "opera", "micros", "guest relations", "catering", "wedding planning"
        )));
        
        // LEGAL
        SKILLS_BY_DOMAIN.put("Legal", new HashSet<>(Arrays.asList(
            "legal research", "contract law", "corporate law", "litigation",
            "legal writing", "compliance", "intellectual property", "paralegal",
            "legal drafting", "case management", "legal documentation", "negotiation",
            "arbitration", "mediation", "legal advisory", "statutory compliance"
        )));
    }
    
    // All skills flat set for quick lookup
    private static final Set<String> ALL_SKILLS = new HashSet<>();
    
    static {
        for (Set<String> skills : SKILLS_BY_DOMAIN.values()) {
            ALL_SKILLS.addAll(skills);
        }
    }
    
    // Email pattern
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    
    // Phone patterns (international and local)
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");
    
    // Experience patterns
    private static final Pattern[] EXPERIENCE_PATTERNS = {
        Pattern.compile("(\\d+)\\s*\\+?\\s*years?\\s*(?:of)?\\s*(?:experience|exp)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("experience\\s*[\\:\\-]?\\s*(\\d+)\\s*years?", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(\\d+)\\s*[-–]\\s*(\\d+)\\s*years?\\s*experience", Pattern.CASE_INSENSITIVE),
        Pattern.compile("total\\s*(?:work)?\\s*experience\\s*[\\:\\-]?\\s*(\\d+)\\s*(?:years?|yrs?)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("(\\d+)\\s*(?:years?|yrs?)(?=\\s+(?:of\\s+)?(?:professional|work)?\\s*experience)", Pattern.CASE_INSENSITIVE)
    };
    
    // Education patterns
    private static final Map<String, List<Pattern>> EDUCATION_PATTERNS = new HashMap<>();
    
    static {
        EDUCATION_PATTERNS.put("PhD", Arrays.asList(
            Pattern.compile("\\bphd\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bph\\.d\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("doctorate", Pattern.CASE_INSENSITIVE),
            Pattern.compile("doctor of", Pattern.CASE_INSENSITIVE),
            Pattern.compile("doctoral", Pattern.CASE_INSENSITIVE)
        ));
        
        EDUCATION_PATTERNS.put("Master's Degree", Arrays.asList(
            Pattern.compile("\\bmaster\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bm\\.tech\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bm\\.sc\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bm\\.e\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bm\\.a\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bms\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bmba\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("post graduate", Pattern.CASE_INSENSITIVE),
            Pattern.compile("postgraduate", Pattern.CASE_INSENSITIVE),
            Pattern.compile("master of", Pattern.CASE_INSENSITIVE)
        ));
        
        EDUCATION_PATTERNS.put("Bachelor's Degree", Arrays.asList(
            Pattern.compile("\\bbachelor\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bb\\.tech\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bb\\.sc\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bb\\.e\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bb\\.a\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bbs\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bbe\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("bca", Pattern.CASE_INSENSITIVE),
            Pattern.compile("bba", Pattern.CASE_INSENSITIVE),
            Pattern.compile("graduat", Pattern.CASE_INSENSITIVE),
            Pattern.compile("undergraduate", Pattern.CASE_INSENSITIVE),
            Pattern.compile("bachelor of", Pattern.CASE_INSENSITIVE)
        ));
        
        EDUCATION_PATTERNS.put("Diploma", Arrays.asList(
            Pattern.compile("\\bdiploma\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("associate", Pattern.CASE_INSENSITIVE),
            Pattern.compile("polytechnic", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\biti\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("vocational", Pattern.CASE_INSENSITIVE)
        ));
        
        EDUCATION_PATTERNS.put("High School", Arrays.asList(
            Pattern.compile("high school", Pattern.CASE_INSENSITIVE),
            Pattern.compile("secondary", Pattern.CASE_INSENSITIVE),
            Pattern.compile("higher secondary", Pattern.CASE_INSENSITIVE),
            Pattern.compile("ssc", Pattern.CASE_INSENSITIVE),
            Pattern.compile("hsc", Pattern.CASE_INSENSITIVE),
            Pattern.compile("intermediate", Pattern.CASE_INSENSITIVE),
            Pattern.compile("12th", Pattern.CASE_INSENSITIVE),
            Pattern.compile("10th", Pattern.CASE_INSENSITIVE)
        ));
    }
    
    // University/College patterns for name extraction
    private static final Pattern[] UNIVERSITY_PATTERNS = {
        Pattern.compile("(?:university|college|institute|institution|school of)\\s+of\\s+([A-Za-z\\s]+)", Pattern.CASE_INSENSITIVE),
        Pattern.compile("([A-Za-z\\s]+)\\s+(?:university|college|institute|institution)", Pattern.CASE_INSENSITIVE)
    };
    
    // Year patterns for date extraction
    private static final Pattern YEAR_PATTERN = Pattern.compile("\\b(19|20)\\d{2}\\b");
    
    // Main parsing method
    public Map<String, Object> parseResume(MultipartFile file) throws IOException {
        String text = extractTextFromFile(file);
        return parseResumeText(text);
    }
    
    public Map<String, Object> parseResumeText(String text) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        // Clean the text
        String cleanText = text.replaceAll("\\s+", " ").trim();
        
        // Extract basic information
        String email = extractEmail(cleanText);
        String phone = extractPhone(cleanText);
        String fullName = extractName(cleanText, email);
        
        result.put("fullName", fullName);
        result.put("email", email);
        result.put("phone", phone);
        
        // Extract professional information
        int experienceYears = extractExperience(cleanText);
        result.put("experienceYears", experienceYears);
        
        String educationLevel = extractEducation(cleanText);
        result.put("educationLevel", educationLevel);
        
        // Extract skills by domain
        Map<String, Set<String>> skillsByDomain = extractSkillsByDomain(cleanText);
        result.put("skillsByDomain", skillsByDomain);
        
        // Get all skills
        Set<String> allSkills = new HashSet<>();
        for (Set<String> domainSkills : skillsByDomain.values()) {
            allSkills.addAll(domainSkills);
        }
        result.put("skills", allSkills);
        
        // Identify primary domain
        String primaryDomain = identifyPrimaryDomain(skillsByDomain);
        result.put("primaryDomain", primaryDomain);
        
        // Extract education details
        List<Map<String, String>> educationDetails = extractEducationDetails(cleanText);
        result.put("educationDetails", educationDetails);
        
        // Extract work experience details
        List<Map<String, String>> workExperience = extractWorkExperience(cleanText);
        result.put("workExperience", workExperience);
        
        // Extract certifications
        List<String> certifications = extractCertifications(cleanText);
        result.put("certifications", certifications);
        
        // Extract languages
        List<String> languages = extractLanguages(cleanText);
        result.put("languages", languages);
        
        // Extract projects
        List<String> projects = extractProjects(cleanText);
        result.put("projects", projects);
        
        // Extract achievements
        List<String> achievements = extractAchievements(cleanText);
        result.put("achievements", achievements);
        
        // Calculate match score for given job (if provided)
        result.put("rawText", cleanText);
        
        return result;
    }
    
    private String extractTextFromFile(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) return "";
        
        String lowerFileName = fileName.toLowerCase();
        
        if (lowerFileName.endsWith(".pdf")) {
            try (PDDocument document = PDDocument.load(file.getInputStream())) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } else if (lowerFileName.endsWith(".docx") || lowerFileName.endsWith(".doc")) {
            // For DOCX files, you'd need Apache POI
            // For simplicity, we'll treat as text
            return new String(file.getBytes());
        } else {
            return new String(file.getBytes());
        }
    }
    
    private String extractEmail(String text) {
        Matcher matcher = EMAIL_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return "";
    }
    
    private String extractPhone(String text) {
        Matcher matcher = PHONE_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group();
        }
        return "";
    }
    
    private String extractName(String text, String email) {
        // Try to extract name from email
        if (email != null && !email.isEmpty()) {
            String emailLocal = email.split("@")[0];
            String nameFromEmail = emailLocal.replace(".", " ").replace("_", " ").replace("-", " ");
            if (nameFromEmail.length() > 2) {
                String[] parts = nameFromEmail.split("\\s+");
                StringBuilder name = new StringBuilder();
                for (String part : parts) {
                    if (part.length() > 0) {
                        name.append(Character.toUpperCase(part.charAt(0)))
                            .append(part.substring(1).toLowerCase())
                            .append(" ");
                    }
                }
                if (name.length() > 0) {
                    return name.toString().trim();
                }
            }
        }
        
        // Try to find name at the beginning of resume
        String firstLine = text.split("\\n")[0].trim();
        if (firstLine.length() > 0 && firstLine.length() < 50 && !firstLine.contains("@") && !firstLine.matches(".*\\d.*")) {
            return firstLine;
        }
        
        // Try to find "Name:" pattern
        Pattern namePattern = Pattern.compile("(?:Name|Full Name)[\\s:]+([A-Za-z\\s.]+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = namePattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        return "Candidate";
    }
    
    private int extractExperience(String text) {
        for (Pattern pattern : EXPERIENCE_PATTERNS) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                try {
                    int years = Integer.parseInt(matcher.group(1));
                    if (years > 0 && years <= 50) {
                        return years;
                    }
                    if (matcher.groupCount() >= 2) {
                        int years2 = Integer.parseInt(matcher.group(2));
                        return (years + years2) / 2;
                    }
                } catch (NumberFormatException e) {
                    // Continue to next pattern
                }
            }
        }
        
        // Estimate from work history dates
        Matcher yearMatcher = YEAR_PATTERN.matcher(text);
        List<Integer> years = new ArrayList<>();
        while (yearMatcher.find()) {
            try {
                years.add(Integer.parseInt(yearMatcher.group()));
            } catch (NumberFormatException e) {}
        }
        
        if (years.size() >= 2) {
            Collections.sort(years);
            int minYear = years.get(0);
            int maxYear = years.get(years.size() - 1);
            int estimatedYears = maxYear - minYear;
            if (estimatedYears > 0 && estimatedYears <= 50) {
                return estimatedYears;
            }
        }
        
        return 0;
    }
    
    private String extractEducation(String text) {
        String[] levels = {"PhD", "Master's Degree", "Bachelor's Degree", "Diploma", "High School"};
        
        for (String level : levels) {
            List<Pattern> patterns = EDUCATION_PATTERNS.get(level);
            if (patterns != null) {
                for (Pattern pattern : patterns) {
                    if (pattern.matcher(text).find()) {
                        return level;
                    }
                }
            }
        }
        
        // Check for degree fields
        String[] degreeFields = {"engineering", "technology", "science", "arts", "commerce", "business", "computer"};
        for (String field : degreeFields) {
            if (text.toLowerCase().contains(field)) {
                return "Bachelor's Degree";
            }
        }
        
        return "Not Specified";
    }
    
    private Map<String, Set<String>> extractSkillsByDomain(String text) {
        Map<String, Set<String>> result = new HashMap<>();
        String lowerText = text.toLowerCase();
        
        for (Map.Entry<String, Set<String>> entry : SKILLS_BY_DOMAIN.entrySet()) {
            String domain = entry.getKey();
            Set<String> domainSkills = entry.getValue();
            Set<String> foundSkills = new HashSet<>();
            
            for (String skill : domainSkills) {
                // Use word boundaries for accurate matching
                Pattern pattern = Pattern.compile("\\b" + Pattern.quote(skill) + "\\b", Pattern.CASE_INSENSITIVE);
                if (pattern.matcher(lowerText).find()) {
                    foundSkills.add(skill);
                }
            }
            
            if (!foundSkills.isEmpty()) {
                result.put(domain, foundSkills);
            }
        }
        
        return result;
    }
    
    private String identifyPrimaryDomain(Map<String, Set<String>> skillsByDomain) {
        if (skillsByDomain.isEmpty()) {
            return "General";
        }
        
        String primaryDomain = "";
        int maxSkills = 0;
        
        for (Map.Entry<String, Set<String>> entry : skillsByDomain.entrySet()) {
            if (entry.getValue().size() > maxSkills) {
                maxSkills = entry.getValue().size();
                primaryDomain = entry.getKey();
            }
        }
        
        return primaryDomain;
    }
    
    private List<Map<String, String>> extractEducationDetails(String text) {
        List<Map<String, String>> educationList = new ArrayList<>();
        String[] lines = text.split("\\n");
        
        boolean inEducationSection = false;
        
        for (String line : lines) {
            String lowerLine = line.toLowerCase();
            
            // Detect education section
            if (lowerLine.contains("education") || lowerLine.contains("academic") || lowerLine.contains("qualification")) {
                inEducationSection = true;
                continue;
            }
            
            if (inEducationSection) {
                if (lowerLine.contains("experience") || lowerLine.contains("skills") || lowerLine.contains("certification")) {
                    inEducationSection = false;
                    continue;
                }
                
                // Look for degree patterns
                for (Map.Entry<String, List<Pattern>> entry : EDUCATION_PATTERNS.entrySet()) {
                    String degreeLevel = entry.getKey();
                    for (Pattern pattern : entry.getValue()) {
                        if (pattern.matcher(lowerLine).find()) {
                            Map<String, String> education = new HashMap<>();
                            education.put("degree", degreeLevel);
                            education.put("institution", extractInstitutionFromLine(line));
                            
                            // Extract year
                            Matcher yearMatcher = YEAR_PATTERN.matcher(line);
                            if (yearMatcher.find()) {
                                education.put("year", yearMatcher.group());
                            }
                            
                            educationList.add(education);
                            break;
                        }
                    }
                }
            }
        }
        
        return educationList;
    }
    
    private String extractInstitutionFromLine(String line) {
        // Look for university/college names
        for (Pattern pattern : UNIVERSITY_PATTERNS) {
            Matcher matcher = pattern.matcher(line);
            if (matcher.find()) {
                return matcher.group(1).trim();
            }
        }
        return "";
    }
    
    private List<Map<String, String>> extractWorkExperience(String text) {
        List<Map<String, String>> experienceList = new ArrayList<>();
        String[] lines = text.split("\\n");
        
        boolean inExperienceSection = false;
        
        for (String line : lines) {
            String lowerLine = line.toLowerCase();
            
            if (lowerLine.contains("experience") || lowerLine.contains("work history") || lowerLine.contains("employment")) {
                inExperienceSection = true;
                continue;
            }
            
            if (inExperienceSection) {
                if (lowerLine.contains("education") || lowerLine.contains("skills") || lowerLine.contains("certification")) {
                    inExperienceSection = false;
                    continue;
                }
                
                // Look for company names and job titles
                if (line.trim().length() > 0 && !lowerLine.contains("summary") && !lowerLine.contains("profile")) {
                    Map<String, String> experience = new HashMap<>();
                    
                    // Extract years
                    Matcher yearMatcher = YEAR_PATTERN.matcher(line);
                    List<String> years = new ArrayList<>();
                    while (yearMatcher.find()) {
                        years.add(yearMatcher.group());
                    }
                    
                    if (years.size() >= 2) {
                        experience.put("startYear", years.get(0));
                        experience.put("endYear", years.get(1));
                    } else if (years.size() == 1) {
                        experience.put("year", years.get(0));
                    }
                    
                    experience.put("description", line.trim());
                    experienceList.add(experience);
                }
            }
        }
        
        return experienceList;
    }
    
    private List<String> extractCertifications(String text) {
        List<String> certifications = new ArrayList<>();
        String lowerText = text.toLowerCase();
        
        String[] certKeywords = {"certified", "certification", "certificate", "credential", "license"};
        
        for (String keyword : certKeywords) {
            Pattern pattern = Pattern.compile("([^\\n]{0,50}" + keyword + "[^\\n]{0,100})", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(text);
            while (matcher.find()) {
                String cert = matcher.group(1).trim();
                if (cert.length() > 5 && cert.length() < 200) {
                    certifications.add(cert);
                }
            }
        }
        
        return certifications;
    }
    
    private List<String> extractLanguages(String text) {
        List<String> languages = new ArrayList<>();
        String lowerText = text.toLowerCase();
        
        String[] commonLanguages = {
            "english", "hindi", "marathi", "tamil", "telugu", "kannada", "malayalam", "bengali",
            "gujarati", "punjabi", "urdu", "spanish", "french", "german", "japanese", "chinese",
            "russian", "arabic", "portuguese", "italian", "dutch", "korean"
        };
        
        for (String lang : commonLanguages) {
            if (lowerText.contains(lang)) {
                languages.add(lang.substring(0, 1).toUpperCase() + lang.substring(1));
            }
        }
        
        return languages;
    }
    
    private List<String> extractProjects(String text) {
        List<String> projects = new ArrayList<>();
        String lowerText = text.toLowerCase();
        
        Pattern projectPattern = Pattern.compile("(?:project|developed|built|created|implemented)[\\s:]+([^\\n]{10,200})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = projectPattern.matcher(text);
        
        while (matcher.find()) {
            String project = matcher.group(1).trim();
            if (project.length() > 10 && project.length() < 200) {
                projects.add(project);
            }
        }
        
        return projects;
    }
    
    private List<String> extractAchievements(String text) {
        List<String> achievements = new ArrayList<>();
        
        String[] achievementKeywords = {"achieved", "awarded", "recognized", "won", "secured", "accomplished", "honored"};
        
        for (String keyword : achievementKeywords) {
            Pattern pattern = Pattern.compile(keyword + "\\s+([^\\n]{10,150})", Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(text);
            while (matcher.find()) {
                String achievement = matcher.group(1).trim();
                if (achievement.length() > 10) {
                    achievements.add(achievement);
                }
            }
        }
        
        return achievements;
    }
    
    // Method to calculate match score against job requirements
    public Map<String, Object> calculateMatchScore(Map<String, Object> candidateData, Set<String> jobRequiredSkills) {
        Map<String, Object> result = new HashMap<>();
        
        @SuppressWarnings("unchecked")
        Set<String> candidateSkills = (Set<String>) candidateData.get("skills");
        
        if (candidateSkills == null || jobRequiredSkills == null || jobRequiredSkills.isEmpty()) {
            result.put("matchScore", 0.0);
            result.put("matchedSkills", new HashSet<>());
            result.put("missingSkills", jobRequiredSkills != null ? jobRequiredSkills : new HashSet<>());
            return result;
        }
        
        Set<String> candidateLower = candidateSkills.stream()
            .map(String::toLowerCase)
            .collect(HashSet::new, HashSet::add, HashSet::addAll);
        
        Set<String> matchedSkills = new HashSet<>();
        Set<String> missingSkills = new HashSet<>();
        
        for (String reqSkill : jobRequiredSkills) {
            String reqLower = reqSkill.toLowerCase();
            boolean matched = false;
            
            for (String candSkill : candidateLower) {
                if (reqLower.equals(candSkill) || 
                    candSkill.contains(reqLower) || 
                    reqLower.contains(candSkill)) {
                    matchedSkills.add(reqSkill);
                    matched = true;
                    break;
                }
            }
            
            if (!matched) {
                missingSkills.add(reqSkill);
            }
        }
        
        double matchScore = (double) matchedSkills.size() / jobRequiredSkills.size() * 100;
        matchScore = Math.round(matchScore * 10.0) / 10.0;
        
        result.put("matchScore", matchScore);
        result.put("matchedSkills", matchedSkills);
        result.put("missingSkills", missingSkills);
        
        return result;
    }
}