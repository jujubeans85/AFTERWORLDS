"""Typography-only edits for authored design prose; never runs on row IDs or bindings."""
import re
REPLACEMENTS = {
'Gemma4E4BITThinking':'Gemma4 E4B IT Thinking','Gemma4E2BITThinking':'Gemma4 E2B IT Thinking','Gemma327BIT':'Gemma3 27B IT','MMLUPro':'MMLU Pro',
'potentialPUEincrease':'potential PUE increase','andDresdenconstruction':'and Dresden construction','combiningcarbonandwaterunits':'combining carbon and water units',
'IrishseriesusesnationalMeteredSharePercent':'Irish series uses nationalMeteredSharePercent','nationalsharehistory':'national share history','universalAIelectricity':'universal AI electricity',
'nameColumbiaRiverprojects':'name Columbia River projects','orinferfacilitycoordinates':'or infer facility coordinates','basedMCASmechanismfacet':'based MCAS mechanism facet',
'orAIinvolvementisencoded':'or AI involvement is encoded','Investigationrecords':'Investigation records','Twoinvestigationexamples':'Two investigation examples',
'conventionalautomationisnotautomaticallymachinelearning':'conventional automation is not automatically machine learning',
'documentedmechanismandlackofMLattribution':'documented mechanism and lack of ML attribution','inventedflightpaths':'invented flight paths','recordsarethreeaccidents':'records are three accidents',
'displayapproximately':'display approximately','magnifiedinsetmakes':'magnified inset makes','withoutchangingthemain':'without changing the main',
'fillorpreciseAfricavalue':'fill or precise Africa value','centreelectricitycontrast':'centre electricity contrast','onlydemandorallcountries':'only demand or all countries',
'behindthelargecontrast':'behind the large contrast','qualifierandcontinent':'qualifier and continent','countrygeographicgrains':'country geographic grains','mustneverbecomeexact':'must never become exact',
'Donotcomputeanexact':'Do not compute an exact','ratiofromanupperbound':'ratio from an upper bound','Differentgeographicgrainsmustremainexplicit':'Different geographic grains must remain explicit',
'Expertqualitylabels':'Expert quality labels','andstandardreferralblue':'and standard referral blue','Produceraccuracyteal':'Producer accuracy teal',
'producer_accuracyanduser_accuracy':'producer_accuracy and user_accuracy','telecomwasteanditscollectionshare':'telecom waste and its collection share',
'formalcollectionteal':'formal collection teal','responseMethodandmetricDefinitionare':'responseMethod and metricDefinition are','archivalbenchmarkover':'archival benchmark over',
'anyterritorialclaimcorrect':'any territorial claim correct','archivedmodelresults':'archived model results','OriginalEnglishwhite':'Original English white',
'patternsandlabelsrepeatcategories':'patterns and labels repeat categories','MMLUarchivaldatasetdescription':'MMLU archival dataset description','preparationcategories':'preparation categories',
'preparationcategory':'preparation category','translationqualityfrom':'translation quality from','countlabelsandpatternsremainvisible':'count labels and patterns remain visible',
'weightedrepresentationor':'weighted representation or','categoryforunreportedmembers':'category for unreported members','countryallocationbeyondsource':'country allocation beyond source',
'annualpanelreportpresentedattheDialogue':'annual panel report presented at the Dialogue','Nodepositionisnongeographic':'Node position is nongeographic',
'Scientificsynthesisteal':'Scientific synthesis teal','governancediscussionblue':'governance discussion blue','mechanismwordsidentifyroles':'mechanism words identify roles',
'notcompletedreportsor':'not completed reports or','bindingglobalregulation':'binding global regulation','Assistancerolesteal':'Assistance roles teal',
'oversightstatementsbluewithdatepattern':'oversight statements blue with date pattern','anddatedoversightstatements':'and dated oversight statements',
'claimthatallappealrightsareabsent':'claim that all appeal rights are absent','operationalstatements':'operational statements','atthatstageisnotneveraudited':'at that stage is not never audited',
'Noapplicantnotificationisnotabsenceofappealrights':'No applicant notification is not absence of appeal rights','oversightstatements':'oversight statements',
'Twoseparatezero':'Two separate zero','Twoseparate':'Two separate','Twoequal':'Two equal','Threeequal':'Three equal','TwoOregonwaterbars':'Two Oregon water bars',
'NoIrishshare':'No Irish share','Irishshare':'Irish share','datedIrishrings':'dated Irish rings','global context neutralwhite':'global context neutral white','fromAI':'from AI',
'forAI':'for AI','orAI':'or AI','notAI':'not AI','allAI':'all AI','AIonly':'AI only','AI-focusedgrowth':'AI-focused growth','AIinvolvement':'AI involvement',
'thelatterreadable':'the latter readable','andanopenupper':'and an open upper','boundmarkerat':'bound marker at','basedrails':'based rails','fortheUnitedStates':'for the United States',
'Africabluewith':'Africa blue with','forAfrica':'for Africa','andthe':'and the','theautomationlabel':'the automation label','thethree':'the three','orclaimthat':'or claim that',
'mechanismwhitewith':'mechanism white with','originalMCASlogic':'original MCAS logic','greyblue':'grey blue','asAIcaused':'as AI-caused',
'Saint-Ghislaincanaluse':'Saint-Ghislain canal use','companywater':'company water','catchmentflow':'catchment flow','householddeprivation':'household deprivation',
'Oregonyears':'Oregon years','Canaldescription':'Canal description','lifecycletotals':'lifecycle totals','marginalresponse':'marginal response','versusresponse':'versus response',
'andwaterunits':'and water units','notfleet':'not fleet','cumulativeexposure':'cumulative exposure','crashrates':'crash rates','humanbaseline':'human baseline','Humanbaseline':'Human baseline',
'Waymorates':'Waymo rates','Waymoexposure':'Waymo exposure','notcrashes':'not crashes','confidenceintervals':'confidence intervals',
'productionhistory':'production history','shipmentcategories':'shipment categories','domesticandexport':'domestic and export','sourcequalifiers':'source qualifiers',
'floorarea':'floor area','floorspace':'floorspace','H200andMI325X':'H200 and MI325X','independentU.S.testing':'independent U.S. testing','hyperscaler':'hyperscaler',
'formallycollected':'formally collected','showcross-borderwaste':'show cross-border waste','smallIT':'small IT','smallerIT':'smaller IT','telecomsubset':'telecom subset','andsubset':'and subset',
'Generatedamber':'Generated amber','total99and':'total 99 and','becausevalueisnull':'because value is null','nullvaluefor':'null value for','bindslowerandupper':'binds lower and upper',
'riskvalue':'risk value','withrandomizedN':'with randomizedN','putHRandrisk':'put HR and risk','toHRonly':'to HR only','source0':'source 0','reportedvaluefor':'reported value for',
'andci95endpoints':'and ci95 endpoints','analyzedNis':'analyzedN is','randomizedNis':'randomizedN is','controlrandomizedN':'control randomizedN',
'AutonomousAIteal':'Autonomous AI teal','standardreferral':'standard referral','anddenominator':'and denominator','anduser_accuracy':'and user_accuracy',
'forproducer_accuracy':'for producer_accuracy','useraccuracyamber':'user accuracy amber','classnames':'class names','marshorfloodedflat':'marsh or flooded flat',
'producer/useraccuracy':'producer/user accuracy','aqualityscore':'a quality score','toIoUorF1for':'to IoU or F1 for','forIoU':'for IoU','pixel_accuracyandF1':'pixel_accuracy and F1',
'redsum':'red sum','andwhitesum':'and white sum','percentage-pointchange':'percentage-point change','relativegrowth':'relative growth','nameKepler-90iandKepler-80gandtheirhostStar':'name Kepler-90i and Kepler-80g and their hostStar',
'inspectNASA':'inspect NASA','publishedscoreis':'published score is','sovereigntytruth':'sovereignty truth','currentcapability':'current capability',
'scoringdefinition':'scoring definition','territoryscope':'territory scope','countriesorpeople':'countries or people','professionalteal':'professional teal',
'crowdsourcedblue':'crowdsourced blue','machineamber':'machine amber','languageversions':'language versions','mustsum':'must sum','languageassigned':'language assigned',
'Onehundredtwenty-one':'One hundred twenty-one','source-namedcountriesmay':'source-named countries may','scientific-panelmember':'scientific-panel member',
'favourteal':'favour teal','againstamber':'against amber','abstainingblue':'abstaining blue','abstentiongroups':'abstention groups','absentmembers':'absent members',
'appointmentvote':'appointment vote','recordedvotesare':'recorded votes are','recordedvotes':'recorded votes','allUNmembers':'all UN members',
'noflowparticlesor':'no flow particles or','completed-reportcount':'completed-report count','reporthandoff':'report handoff','andmandates':'and mandates','panelmembers':'panel members',
'pilotroles':'pilot roles','Datebadges':'Date badges','casevolume':'case volume','refusalrateor':'refusal rate or','appealencoding':'appeal encoding','dangerseverityramp':'danger severity ramp',
'actualdate':'actual date','OfficialUKrecords':'Official UK records','ofassistance':'of assistance','humansdecideclaims':'humans decide claims',
'No-audit-planned-':'No audit planned ','fromJune':'from June','from2010':'from 2010','to2022':'to 2022',
'peryear':'per year','labouronly':'labour only','sourcegrid':'source grid','fieldworkdates':'fieldwork dates',
}
# Protect source field names and standard technical labels before spacing prose numbers.
PROTECTED=['nationalMeteredSharePercent','publishedParentheticalUncertainty','consortiumCountries','denominatorAccounts','publicationDate','announcementDate','estimateConfidence','estimateNotes','primaryReference','organizationCountries','confidenceLevel','waymoCrashCount','randomizedN','analyzedN','ci95','ciLower','ciUpper','sampleDenominator','qualityScore','wineType','timeBasis','cfePercent','measureType','sourceGeography','geographicId','sourceId','sourceLocator','testSampleN','responseMethod','metricDefinition','territoryCount','hostStar','sourceWeek','uptimeFraction','automatedDetectionCount','growthStage','standardDeviation','F1','IoU','CO2eq','CO2e','CO2','H200','MI325X','Gemma4','Gemma3','E4B','E2B','27B','SEAS5','CETS225','HAIPv2','AP','MW','GWh','kWh','TWh','FY2025','FY2026','CY2025','H1','ML','MCAS','ISO','USD']

def refine(text):
    for a,b in sorted(REPLACEMENTS.items(),key=lambda p:-len(p[0])):text=text.replace(a,b)
    saved={}
    for n,token in enumerate(PROTECTED):
        if token in text:
            key=chr(0xE000+n);saved[key]=token;text=text.replace(token,key)
    text=re.sub(r'(?<=[A-Za-z])(?=\d)', ' ',text)
    text=re.sub(r'(?<=\d)(?=[A-Za-z])', ' ',text)
    text=re.sub(r'(?<=%)(?=[A-Za-z])',' ',text)
    text=re.sub(r'(?<=[,;])(?=[A-Za-z0-9])',' ',text)
    for key,token in saved.items():text=text.replace(key,token)
    return text

def apply(overrides):
    for spec in overrides.values():
        for key in ['geometry','color','backside','legend','transform']:
            if key in spec:spec[key]=refine(spec[key])
        spec['special']=[refine(s) for s in spec.get('special',[])]

REPLACEMENTS.update({
'headlineMWamount':'headline MW amount','MWreference':'MW reference','MWincremental':'MW incremental','MWmixed':'MW mixed','deliveredMWh':'delivered MWh',
'U.S.andChina':'U.S. and China','U.S.shares':'U.S. shares','U.S.components':'U.S. components','oneEUVsystem':'one EUV system','FiveEuropean':'Five European','andTheDallespilot':'and The Dalles pilot',
'ofwafer':'of wafer','toTaiwan':'to Taiwan','TSMCdated':'TSMC dated','fromTaiwan':'from Taiwan','ofEarth':'of Earth','foldmedian':'fold median','TWhglobal':'TWh global',
'Onlyenergychangeis':'Only energychange is','plotWaymoandhuman':'plot Waymo and human','atvalue':'at value','horizontalciLower':'horizontal ciLower','ciUpperwhiskers':'ciUpper whiskers',
'Waymoteal':'Waymo teal','providerCSV':'provider CSV','correctedCSV':'corrected CSV','throughJune':'through June','tokenresponse':'token response','andSaint':'and Saint',
'Waterquantity':'Water quantity','onlywater':'only water','twoOregon':'two Oregon','recordfacets':'record facets','U.S.teal':'U.S. teal','with<':'with <','nozero':'no zero',
'per-residentdata':'per-resident data','theupper':'the upper','orzero':'or zero','andno':'and no','pilotand':'pilot and','regressionN':'regression N'
})
