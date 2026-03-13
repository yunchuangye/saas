-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: gujia
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auto_valuations`
--

DROP TABLE IF EXISTS `auto_valuations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auto_valuations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city_id` int DEFAULT NULL,
  `estate_id` int DEFAULT NULL,
  `area` decimal(10,2) DEFAULT NULL,
  `rooms` int DEFAULT NULL,
  `floor` int DEFAULT NULL,
  `property_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valuation_result` decimal(15,2) DEFAULT NULL,
  `valuation_min` decimal(15,2) DEFAULT NULL,
  `valuation_max` decimal(15,2) DEFAULT NULL,
  `confidence` decimal(5,2) DEFAULT NULL,
  `method` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comparable_cases` json DEFAULT NULL,
  `ai_analysis` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT (now()),
  `org_id` int DEFAULT NULL,
  `property_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `building_area` decimal(10,2) DEFAULT NULL,
  `total_floors` int DEFAULT NULL,
  `building_age` int DEFAULT NULL,
  `orientation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `decoration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_elevator` int DEFAULT '0',
  `has_parking` int DEFAULT '0',
  `purpose` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_value` decimal(15,2) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `confidence_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_data` json DEFAULT NULL,
  `llm_analysis` json DEFAULT NULL,
  `comparable_count` int DEFAULT '0',
  `building_id` int DEFAULT NULL,
  `unit_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auto_valuations`
--

LOCK TABLES `auto_valuations` WRITE;
/*!40000 ALTER TABLE `auto_valuations` DISABLE KEYS */;
INSERT INTO `auto_valuations` VALUES (1,NULL,2,'万科俊园 1号楼 15层03室',1,NULL,95.00,NULL,15,'residential',6776160.00,5556451.00,7995869.00,60.00,'案例比较法（6个参考案例）+ LLM辅助分析','\"[{\\\"id\\\":26,\\\"cityId\\\":1,\\\"estateId\\\":1,\\\"buildingId\\\":2,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳公园南路1号万科俊园2号楼15层01室\\\",\\\"area\\\":\\\"95.00\\\",\\\"rooms\\\":3,\\\"floor\\\":15,\\\"totalFloors\\\":28,\\\"orientation\\\":\\\"朝南\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"10200000.00\\\",\\\"unitPrice\\\":\\\"107368.00\\\",\\\"transactionDate\\\":\\\"2026-02-18T00:00:00.000Z\\\",\\\"source\\\":\\\"我爱我家\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.02678571428571428},{\\\"id\\\":23,\\\"cityId\\\":1,\\\"estateId\\\":1,\\\"buildingId\\\":1,\\\"unitId\\\":7,\\\"address\\\":\\\"朝阳公园南路1号万科俊园1号楼15层01室\\\",\\\"area\\\":\\\"89.50\\\",\\\"rooms\\\":3,\\\"floor\\\":15,\\\"totalFloors\\\":32,\\\"orientation\\\":\\\"南北通透\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"9400000.00\\\",\\\"unitPrice\\\":\\\"104972.00\\\",\\\"transactionDate\\\":\\\"2025-11-14T00:00:00.000Z\\\",\\\"source\\\":\\\"贝壳\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.034736842105263156},{\\\"id\\\":51,\\\"cityId\\\":1,\\\"estateId\\\":null,\\\"buildingId\\\":null,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳区麦子店街道麦子店西路\\\",\\\"area\\\":\\\"92.00\\\",\\\"rooms\\\":3,\\\"floor\\\":12,\\\"totalFloors\\\":28,\\\"orientation\\\":\\\"朝南\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"9500000.00\\\",\\\"unitPrice\\\":\\\"103261.00\\\",\\\"transactionDate\\\":\\\"2026-01-08T00:00:00.000Z\\\",\\\"source\\\":\\\"贝壳\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.03501879699248121},{\\\"id\\\":52,\\\"cityId\\\":1,\\\"estateId\\\":null,\\\"buildingId\\\":null,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳区朝阳北路101号\\\",\\\"area\\\":\\\"88.00\\\",\\\"rooms\\\":3,\\\"floor\\\":15,\\\"totalFloors\\\":32,\\\"orientation\\\":\\\"南北通透\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"9200000.00\\\",\\\"unitPrice\\\":\\\"104545.00\\\",\\\"transactionDate\\\":\\\"2026-02-25T00:00:00.000Z\\\",\\\"source\\\":\\\"链家\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.04421052631578947},{\\\"id\\\":50,\\\"cityId\\\":1,\\\"estateId\\\":null,\\\"buildingId\\\":null,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳区朝外大街甲6号\\\",\\\"area\\\":\\\"98.00\\\",\\\"rooms\\\":3,\\\"floor\\\":18,\\\"totalFloors\\\":30,\\\"orientation\\\":\\\"南北通透\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"10100000.00\\\",\\\"unitPrice\\\":\\\"103061.00\\\",\\\"transactionDate\\\":\\\"2025-11-20T00:00:00.000Z\\\",\\\"source\\\":\\\"我爱我家\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.07144736842105262},{\\\"id\\\":39,\\\"cityId\\\":1,\\\"estateId\\\":3,\\\"buildingId\\\":8,\\\"unitId\\\":null,\\\"address\\\":\\\"来广营西路88号保利中央公园3栋18层01室\\\",\\\"area\\\":\\\"98.00\\\",\\\"rooms\\\":3,\\\"floor\\\":18,\\\"totalFloors\\\":28,\\\"orientation\\\":\\\"朝南\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"8800000.00\\\",\\\"unitPrice\\\":\\\"89796.00\\\",\\\"transactionDate\\\":\\\"2025-12-05T00:00:00.000Z\\\",\\\"source\\\":\\\"贝壳\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.08859022556390979}]\"','1. 估价合理性评价：本次估价综合价为677.62万元，单价71,328元/㎡，明显低于参考案例均价约10.3万元/㎡的水平。参考案例均价集中在103,000-107,000元/㎡区间，且均为近半年内成交，时间较为接近，具有较强的可比性。比较法单价107,097元/㎡与市场成交价基本一致，成本法单价23,875元/㎡明显偏低，符合成本法本身偏低的特点。综合估价低于市场价较多，且置信度标注为“低”，说明估价模型或数据存在较大不确定性。整体来看，估价结果偏低，不够合理，建议重新核实数据和方法。\n\n2. 关键影响因素：正面因素包括：位于朝阳区优质地段，南北通透户型，精装修，配备电梯及停车位，楼层适中（15层），楼龄适中（11年）。负面因素可能是物业所在楼栋具体位置、楼层视野、物业管理状况及市场波动影响，此外，估价置信度低也反映出数据或方法的局限。\n\n3. 市场行情判断：朝阳区作为北京核心区域之一，尤其万科俊园所在的成熟社区，市场需求稳定，价格坚挺。近期成交价均价维持在10万元/㎡以上，显示市场保持活跃且价格坚实。考虑到政策环境趋稳，短期内价格大概率维持或小幅上涨。\n\n4. 风险提示：估价置信度低，可能因数据样本不足或模型参数设定不合理导致估价偏差较大；市场波动风险及政策调控风险；物业具体状况（如装修质量、物业管理）未充分反映；参考案例时间虽近但数量有限，可能影响比较法准确性。\n\n5. 建议：建议委托方重点关注市场最新成交数据，结合实地勘察物业具体状况，调整估价模型参数，提升置信度；同时关注政策动态及市场趋势，合理预判价格波动；若用于交易或融资，建议多方评估结果比对，避免单一估价结果误导决策。','completed','2026-03-13 13:31:17',1,'万科俊园 1号楼 15层03室',95.00,32,11,'south_north','fine',1,1,'mortgage','朝阳区','北京',6776160.00,71328.00,'low','\"{\\\"input\\\":{\\\"propertyType\\\":\\\"residential\\\",\\\"city\\\":\\\"北京\\\",\\\"cityId\\\":1,\\\"district\\\":\\\"朝阳区\\\",\\\"address\\\":\\\"万科俊园 1号楼 15层03室\\\",\\\"buildingAge\\\":11,\\\"totalFloors\\\":32,\\\"floor\\\":15,\\\"buildingArea\\\":95,\\\"orientation\\\":\\\"south_north\\\",\\\"decoration\\\":\\\"fine\\\",\\\"hasElevator\\\":true,\\\"hasParking\\\":true,\\\"purpose\\\":\\\"mortgage\\\",\\\"enableLLM\\\":true,\\\"estateId\\\":1,\\\"estateName\\\":\\\"万科俊园\\\"},\\\"result\\\":{\\\"finalValue\\\":6776160,\\\"unitPrice\\\":71328,\\\"confidenceLevel\\\":\\\"low\\\",\\\"valuationDate\\\":\\\"2026-03-13\\\",\\\"comparativeResult\\\":{\\\"method\\\":\\\"市场比较法\\\",\\\"value\\\":10174243,\\\"unitPrice\\\":107097,\\\"details\\\":{\\\"comparableCount\\\":6,\\\"avgComparablePrice\\\":105156,\\\"adjustedUnitPrice\\\":107097,\\\"timeAdjustmentApplied\\\":\\\"是\\\",\\\"physicalAdjustmentApplied\\\":\\\"是\\\"}},\\\"incomeResult\\\":{\\\"method\\\":\\\"收益法（直接资本化法）\\\",\\\"value\\\":1325683,\\\"unitPrice\\\":13955,\\\"details\\\":{\\\"monthlyRent\\\":7268,\\\"grossAnnualIncome\\\":87216,\\\"vacancyRate\\\":\\\"5.0%\\\",\\\"effectiveGrossIncome\\\":82855,\\\"operatingExpenseRate\\\":\\\"20.0%\\\",\\\"netOperatingIncome\\\":66284,\\\"capitalizationRate\\\":\\\"5.00%\\\",\\\"estimatedValue\\\":1325683}},\\\"costResult\\\":{\\\"method\\\":\\\"成本法（重置成本法）\\\",\\\"value\\\":2268103,\\\"unitPrice\\\":23875,\\\"details\\\":{\\\"landUnitPrice\\\":17850,\\\"landValue\\\":1695750,\\\"constructionCostPerSqm\\\":6000,\\\"constructionCost\\\":570000,\\\"developmentCost\\\":45600,\\\"replacementCost\\\":712768,\\\"physicalDepreciation\\\":133288,\\\"intactRate\\\":\\\"81.3%\\\",\\\"buildingValue\\\":572353,\\\"totalValue\\\":2268103}},\\\"weights\\\":{\\\"comparative\\\":0.6,\\\"income\\\":0.25,\\\"cost\\\":0.15},\\\"adjustments\\\":[{\\\"factor\\\":\\\"区位系数\\\",\\\"description\\\":\\\"朝阳区区域相对城市均价调整\\\",\\\"coefficient\\\":0.75,\\\"impact\\\":-1615000},{\\\"factor\\\":\\\"楼层系数\\\",\\\"description\\\":\\\"15/32层楼层位置调整\\\",\\\"coefficient\\\":1,\\\"impact\\\":0},{\\\"factor\\\":\\\"朝向系数\\\",\\\"description\\\":\\\"south_north朝向调整\\\",\\\"coefficient\\\":1.05,\\\"impact\\\":242250},{\\\"factor\\\":\\\"装修系数\\\",\\\"description\\\":\\\"fine装修标准调整\\\",\\\"coefficient\\\":1.08,\\\"impact\\\":387600},{\\\"factor\\\":\\\"楼龄折旧\\\",\\\"description\\\":\\\"楼龄11年，成新率81.3%\\\",\\\"coefficient\\\":0.813,\\\"impact\\\":-906015}],\\\"marketData\\\":{\\\"cityAvgPrice\\\":68000,\\\"districtAvgPrice\\\":51000,\\\"priceIndex\\\":0.75,\\\"marketTrend\\\":\\\"rising\\\",\\\"trendRate\\\":2.5},\\\"methodology\\\":\\\"本次评估采用市场比较法为主要方法，收益法和成本法作为验证方法。住宅类物业市场交易活跃，可比案例充分，比较法结果可靠性高。\\\",\\\"assumptions\\\":[\\\"估价时点为报告出具日，市场条件以当日为准\\\",\\\"物业不存在重大质量缺陷或法律纠纷\\\",\\\"土地使用权在剩余年限内可正常使用\\\",\\\"周边基础设施和配套设施保持现状\\\",\\\"宏观经济政策和房地产调控政策保持稳定\\\"],\\\"limitations\\\":[\\\"本估价结果仅供参考，不构成交易建议\\\",\\\"实际成交价格可能因市场波动、谈判因素等与估价结果存在差异\\\",\\\"如物业存在重大变化，本估价结果将失效\\\"]},\\\"comparables\\\":[{\\\"id\\\":26,\\\"cityId\\\":1,\\\"estateId\\\":1,\\\"buildingId\\\":2,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳公园南路1号万科俊园2号楼15层01室\\\",\\\"area\\\":\\\"95.00\\\",\\\"rooms\\\":3,\\\"floor\\\":15,\\\"totalFloors\\\":28,\\\"orientation\\\":\\\"朝南\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"10200000.00\\\",\\\"unitPrice\\\":\\\"107368.00\\\",\\\"transactionDate\\\":\\\"2026-02-18T00:00:00.000Z\\\",\\\"source\\\":\\\"我爱我家\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.02678571428571428},{\\\"id\\\":23,\\\"cityId\\\":1,\\\"estateId\\\":1,\\\"buildingId\\\":1,\\\"unitId\\\":7,\\\"address\\\":\\\"朝阳公园南路1号万科俊园1号楼15层01室\\\",\\\"area\\\":\\\"89.50\\\",\\\"rooms\\\":3,\\\"floor\\\":15,\\\"totalFloors\\\":32,\\\"orientation\\\":\\\"南北通透\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"9400000.00\\\",\\\"unitPrice\\\":\\\"104972.00\\\",\\\"transactionDate\\\":\\\"2025-11-14T00:00:00.000Z\\\",\\\"source\\\":\\\"贝壳\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.034736842105263156},{\\\"id\\\":51,\\\"cityId\\\":1,\\\"estateId\\\":null,\\\"buildingId\\\":null,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳区麦子店街道麦子店西路\\\",\\\"area\\\":\\\"92.00\\\",\\\"rooms\\\":3,\\\"floor\\\":12,\\\"totalFloors\\\":28,\\\"orientation\\\":\\\"朝南\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"9500000.00\\\",\\\"unitPrice\\\":\\\"103261.00\\\",\\\"transactionDate\\\":\\\"2026-01-08T00:00:00.000Z\\\",\\\"source\\\":\\\"贝壳\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.03501879699248121},{\\\"id\\\":52,\\\"cityId\\\":1,\\\"estateId\\\":null,\\\"buildingId\\\":null,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳区朝阳北路101号\\\",\\\"area\\\":\\\"88.00\\\",\\\"rooms\\\":3,\\\"floor\\\":15,\\\"totalFloors\\\":32,\\\"orientation\\\":\\\"南北通透\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"9200000.00\\\",\\\"unitPrice\\\":\\\"104545.00\\\",\\\"transactionDate\\\":\\\"2026-02-25T00:00:00.000Z\\\",\\\"source\\\":\\\"链家\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.04421052631578947},{\\\"id\\\":50,\\\"cityId\\\":1,\\\"estateId\\\":null,\\\"buildingId\\\":null,\\\"unitId\\\":null,\\\"address\\\":\\\"朝阳区朝外大街甲6号\\\",\\\"area\\\":\\\"98.00\\\",\\\"rooms\\\":3,\\\"floor\\\":18,\\\"totalFloors\\\":30,\\\"orientation\\\":\\\"南北通透\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"10100000.00\\\",\\\"unitPrice\\\":\\\"103061.00\\\",\\\"transactionDate\\\":\\\"2025-11-20T00:00:00.000Z\\\",\\\"source\\\":\\\"我爱我家\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.07144736842105262},{\\\"id\\\":39,\\\"cityId\\\":1,\\\"estateId\\\":3,\\\"buildingId\\\":8,\\\"unitId\\\":null,\\\"address\\\":\\\"来广营西路88号保利中央公园3栋18层01室\\\",\\\"area\\\":\\\"98.00\\\",\\\"rooms\\\":3,\\\"floor\\\":18,\\\"totalFloors\\\":28,\\\"orientation\\\":\\\"朝南\\\",\\\"propertyType\\\":\\\"住宅\\\",\\\"transactionType\\\":\\\"sale\\\",\\\"price\\\":\\\"8800000.00\\\",\\\"unitPrice\\\":\\\"89796.00\\\",\\\"transactionDate\\\":\\\"2025-12-05T00:00:00.000Z\\\",\\\"source\\\":\\\"贝壳\\\",\\\"isAnomaly\\\":false,\\\"anomalyReason\\\":null,\\\"createdAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"updatedAt\\\":\\\"2026-03-13T13:13:35.000Z\\\",\\\"similarityScore\\\":0.08859022556390979}],\\\"llmResult\\\":{\\\"analysis\\\":\\\"1. 估价合理性评价：本次估价综合价为677.62万元，单价71,328元/㎡，明显低于参考案例均价约10.3万元/㎡的水平。参考案例均价集中在103,000-107,000元/㎡区间，且均为近半年内成交，时间较为接近，具有较强的可比性。比较法单价107,097元/㎡与市场成交价基本一致，成本法单价23,875元/㎡明显偏低，符合成本法本身偏低的特点。综合估价低于市场价较多，且置信度标注为“低”，说明估价模型或数据存在较大不确定性。整体来看，估价结果偏低，不够合理，建议重新核实数据和方法。\\\\n\\\\n2. 关键影响因素：正面因素包括：位于朝阳区优质地段，南北通透户型，精装修，配备电梯及停车位，楼层适中（15层），楼龄适中（11年）。负面因素可能是物业所在楼栋具体位置、楼层视野、物业管理状况及市场波动影响，此外，估价置信度低也反映出数据或方法的局限。\\\\n\\\\n3. 市场行情判断：朝阳区作为北京核心区域之一，尤其万科俊园所在的成熟社区，市场需求稳定，价格坚挺。近期成交价均价维持在10万元/㎡以上，显示市场保持活跃且价格坚实。考虑到政策环境趋稳，短期内价格大概率维持或小幅上涨。\\\\n\\\\n4. 风险提示：估价置信度低，可能因数据样本不足或模型参数设定不合理导致估价偏差较大；市场波动风险及政策调控风险；物业具体状况（如装修质量、物业管理）未充分反映；参考案例时间虽近但数量有限，可能影响比较法准确性。\\\\n\\\\n5. 建议：建议委托方重点关注市场最新成交数据，结合实地勘察物业具体状况，调整估价模型参数，提升置信度；同时关注政策动态及市场趋势，合理预判价格波动；若用于交易或融资，建议多方评估结果比对，避免单一估价结果误导决策。\\\",\\\"confidenceScore\\\":55,\\\"riskLevel\\\":\\\"中\\\",\\\"keyFactors\\\":[\\\"地段优势\\\",\\\"楼层适中\\\",\\\"装修精良\\\",\\\"市场活跃\\\",\\\"估价置信度低\\\"]}}\"','\"{\\\"analysis\\\":\\\"1. 估价合理性评价：本次估价综合价为677.62万元，单价71,328元/㎡，明显低于参考案例均价约10.3万元/㎡的水平。参考案例均价集中在103,000-107,000元/㎡区间，且均为近半年内成交，时间较为接近，具有较强的可比性。比较法单价107,097元/㎡与市场成交价基本一致，成本法单价23,875元/㎡明显偏低，符合成本法本身偏低的特点。综合估价低于市场价较多，且置信度标注为“低”，说明估价模型或数据存在较大不确定性。整体来看，估价结果偏低，不够合理，建议重新核实数据和方法。\\\\n\\\\n2. 关键影响因素：正面因素包括：位于朝阳区优质地段，南北通透户型，精装修，配备电梯及停车位，楼层适中（15层），楼龄适中（11年）。负面因素可能是物业所在楼栋具体位置、楼层视野、物业管理状况及市场波动影响，此外，估价置信度低也反映出数据或方法的局限。\\\\n\\\\n3. 市场行情判断：朝阳区作为北京核心区域之一，尤其万科俊园所在的成熟社区，市场需求稳定，价格坚挺。近期成交价均价维持在10万元/㎡以上，显示市场保持活跃且价格坚实。考虑到政策环境趋稳，短期内价格大概率维持或小幅上涨。\\\\n\\\\n4. 风险提示：估价置信度低，可能因数据样本不足或模型参数设定不合理导致估价偏差较大；市场波动风险及政策调控风险；物业具体状况（如装修质量、物业管理）未充分反映；参考案例时间虽近但数量有限，可能影响比较法准确性。\\\\n\\\\n5. 建议：建议委托方重点关注市场最新成交数据，结合实地勘察物业具体状况，调整估价模型参数，提升置信度；同时关注政策动态及市场趋势，合理预判价格波动；若用于交易或融资，建议多方评估结果比对，避免单一估价结果误导决策。\\\",\\\"confidenceScore\\\":55,\\\"riskLevel\\\":\\\"中\\\",\\\"keyFactors\\\":[\\\"地段优势\\\",\\\"楼层适中\\\",\\\"装修精良\\\",\\\"市场活跃\\\",\\\"估价置信度低\\\"]}\"',6,NULL,NULL);
/*!40000 ALTER TABLE `auto_valuations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bids`
--

DROP TABLE IF EXISTS `bids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bids` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `org_id` int NOT NULL,
  `user_id` int NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `days` int NOT NULL,
  `estimated_days` int DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','accepted','rejected','awarded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bids`
--

LOCK TABLES `bids` WRITE;
/*!40000 ALTER TABLE `bids` DISABLE KEYS */;
/*!40000 ALTER TABLE `bids` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `estate_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floors` int DEFAULT NULL,
  `units_per_floor` int DEFAULT NULL,
  `build_year` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
INSERT INTO `buildings` VALUES (1,1,'1号楼',32,4,2015,'2026-03-13 13:13:35'),(2,1,'2号楼',28,4,2015,'2026-03-13 13:13:35'),(3,1,'3号楼',25,4,2016,'2026-03-13 13:13:35'),(4,2,'A座',35,4,2018,'2026-03-13 13:13:35'),(5,2,'B座',35,4,2018,'2026-03-13 13:13:35'),(6,3,'1栋',30,6,2016,'2026-03-13 13:13:35'),(7,3,'2栋',30,6,2016,'2026-03-13 13:13:35'),(8,3,'3栋',28,6,2017,'2026-03-13 13:13:35'),(9,4,'1号楼',18,2,2019,'2026-03-13 13:13:35'),(10,4,'2号楼',18,2,2019,'2026-03-13 13:13:35'),(11,5,'T1',40,4,2020,'2026-03-13 13:13:35'),(12,5,'T2',38,4,2020,'2026-03-13 13:13:35');
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cases`
--

DROP TABLE IF EXISTS `cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `city_id` int DEFAULT NULL,
  `estate_id` int DEFAULT NULL,
  `building_id` int DEFAULT NULL,
  `unit_id` int DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` decimal(10,2) DEFAULT NULL,
  `rooms` int DEFAULT NULL,
  `floor` int DEFAULT NULL,
  `total_floors` int DEFAULT NULL,
  `orientation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_type` enum('sale','rent') COLLATE utf8mb4_unicode_ci DEFAULT 'sale',
  `price` decimal(15,2) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `transaction_date` timestamp NULL DEFAULT NULL,
  `source` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_anomaly` tinyint(1) DEFAULT '0',
  `anomaly_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cases`
--

LOCK TABLES `cases` WRITE;
/*!40000 ALTER TABLE `cases` DISABLE KEYS */;
INSERT INTO `cases` VALUES (1,1,1,1,5,'朝阳公园南路1号万科俊园1号楼10层01室',89.50,3,10,32,'南北通透','住宅','sale',8500000.00,94972.00,'2024-01-15 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(2,1,1,1,6,'朝阳公园南路1号万科俊园1号楼10层02室',120.30,4,10,32,'朝南','住宅','sale',11800000.00,98089.00,'2024-02-20 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(3,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼8层01室',95.00,3,8,28,'朝南','住宅','sale',9200000.00,96842.00,'2024-03-10 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(4,1,1,1,7,'朝阳公园南路1号万科俊园1号楼15层01室',89.50,3,15,32,'南北通透','住宅','sale',8900000.00,99441.00,'2024-04-05 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(5,1,1,1,8,'朝阳公园南路1号万科俊园1号楼15层02室',120.30,4,15,32,'朝南','住宅','sale',12200000.00,101413.00,'2024-05-18 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(6,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼15层01室',95.00,3,15,28,'朝南','住宅','sale',9600000.00,101053.00,'2024-06-22 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(7,1,1,1,9,'朝阳公园南路1号万科俊园1号楼20层01室',89.50,3,20,32,'南北通透','住宅','sale',9100000.00,101676.00,'2024-07-14 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(8,1,1,1,10,'朝阳公园南路1号万科俊园1号楼20层02室',120.30,4,20,32,'朝南','住宅','sale',12500000.00,103907.00,'2024-08-09 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(9,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼20层01室',95.00,3,20,28,'朝南','住宅','sale',9800000.00,103158.00,'2024-09-25 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(10,1,1,1,11,'朝阳公园南路1号万科俊园1号楼25层01室',89.50,3,25,32,'南北通透','住宅','sale',9300000.00,103911.00,'2024-10-11 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(11,1,1,1,12,'朝阳公园南路1号万科俊园1号楼25层02室',120.30,4,25,32,'朝南','住宅','sale',12800000.00,106400.00,'2024-11-30 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(12,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼25层01室',95.00,3,25,28,'朝南','住宅','sale',10000000.00,105263.00,'2024-12-15 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(13,1,1,1,5,'朝阳公园南路1号万科俊园1号楼10层01室',89.50,3,10,32,'南北通透','住宅','sale',8700000.00,97207.00,'2025-01-20 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(14,1,1,3,NULL,'朝阳公园南路1号万科俊园3号楼12层01室',88.00,3,12,25,'朝南','住宅','sale',8600000.00,97727.00,'2025-02-14 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(15,1,1,1,7,'朝阳公园南路1号万科俊园1号楼15层01室',89.50,3,15,32,'南北通透','住宅','sale',9100000.00,101676.00,'2025-03-08 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(16,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼18层01室',95.00,3,18,28,'朝南','住宅','sale',9800000.00,103158.00,'2025-04-22 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(17,1,1,1,9,'朝阳公园南路1号万科俊园1号楼20层01室',89.50,3,20,32,'南北通透','住宅','sale',9300000.00,103911.00,'2025-05-16 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(18,1,1,1,10,'朝阳公园南路1号万科俊园1号楼20层02室',120.30,4,20,32,'朝南','住宅','sale',12700000.00,105570.00,'2025-06-30 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(19,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼22层01室',95.00,3,22,28,'朝南','住宅','sale',10100000.00,106316.00,'2025-07-19 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(20,1,1,1,11,'朝阳公园南路1号万科俊园1号楼25层01室',89.50,3,25,32,'南北通透','住宅','sale',9500000.00,106145.00,'2025-08-05 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(21,1,1,1,12,'朝阳公园南路1号万科俊园1号楼25层02室',120.30,4,25,32,'朝南','住宅','sale',13000000.00,108062.00,'2025-09-12 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(22,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼26层01室',95.00,3,26,28,'朝南','住宅','sale',10300000.00,108421.00,'2025-10-28 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(23,1,1,1,7,'朝阳公园南路1号万科俊园1号楼15层01室',89.50,3,15,32,'南北通透','住宅','sale',9400000.00,104972.00,'2025-11-14 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(24,1,1,3,NULL,'朝阳公园南路1号万科俊园3号楼20层02室',92.00,3,20,25,'朝南','住宅','sale',9800000.00,106522.00,'2025-12-20 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(25,1,1,1,5,'朝阳公园南路1号万科俊园1号楼10层01室',89.50,3,10,32,'南北通透','住宅','sale',9000000.00,100559.00,'2026-01-10 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(26,1,1,2,NULL,'朝阳公园南路1号万科俊园2号楼15层01室',95.00,3,15,28,'朝南','住宅','sale',10200000.00,107368.00,'2026-02-18 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(27,1,1,1,9,'朝阳公园南路1号万科俊园1号楼20层01室',89.50,3,20,32,'南北通透','住宅','sale',9600000.00,107263.00,'2026-03-05 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(28,1,2,4,16,'东三环中路39号中海紫御公馆A座1层01室',130.00,4,1,35,'南北通透','住宅','sale',15000000.00,115385.00,'2024-03-15 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(29,1,2,4,17,'东三环中路39号中海紫御公馆A座10层01室',130.00,4,10,35,'南北通透','住宅','sale',16500000.00,126923.00,'2024-06-20 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(30,1,2,4,18,'东三环中路39号中海紫御公馆A座20层01室',130.00,4,20,35,'南北通透','住宅','sale',17200000.00,132308.00,'2024-09-10 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(31,1,2,5,NULL,'东三环中路39号中海紫御公馆B座15层02室',128.00,4,15,35,'朝南','住宅','sale',16800000.00,131250.00,'2025-01-25 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(32,1,2,5,NULL,'东三环中路39号中海紫御公馆B座25层01室',130.00,4,25,35,'南北通透','住宅','sale',17800000.00,136923.00,'2025-06-15 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(33,1,2,4,17,'东三环中路39号中海紫御公馆A座10层01室',130.00,4,10,35,'南北通透','住宅','sale',17000000.00,130769.00,'2025-11-08 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(34,1,2,5,NULL,'东三环中路39号中海紫御公馆B座30层02室',128.00,4,30,35,'朝南','住宅','sale',18200000.00,142188.00,'2026-02-20 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(35,1,3,6,NULL,'来广营西路88号保利中央公园1栋8层01室',98.00,3,8,30,'朝南','住宅','sale',8200000.00,83673.00,'2024-04-12 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(36,1,3,6,NULL,'来广营西路88号保利中央公园1栋15层02室',105.00,3,15,30,'南北通透','住宅','sale',9100000.00,86667.00,'2024-08-22 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(37,1,3,7,NULL,'来广营西路88号保利中央公园2栋20层01室',98.00,3,20,30,'朝南','住宅','sale',8600000.00,87755.00,'2025-02-10 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(38,1,3,7,NULL,'来广营西路88号保利中央公园2栋25层02室',105.00,3,25,30,'南北通透','住宅','sale',9500000.00,90476.00,'2025-07-30 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(39,1,3,8,NULL,'来广营西路88号保利中央公园3栋18层01室',98.00,3,18,28,'朝南','住宅','sale',8800000.00,89796.00,'2025-12-05 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(40,1,3,6,NULL,'来广营西路88号保利中央公园1栋22层01室',105.00,3,22,30,'南北通透','住宅','sale',9700000.00,92381.00,'2026-01-18 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(41,1,NULL,NULL,NULL,'朝阳区东三环北路甲19号',92.00,3,12,28,'朝南','住宅','sale',8800000.00,95652.00,'2024-05-20 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(42,1,NULL,NULL,NULL,'朝阳区朝阳公园路6号',88.00,3,8,25,'南北通透','住宅','sale',8300000.00,94318.00,'2024-07-15 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(43,1,NULL,NULL,NULL,'朝阳区亮马桥路50号',115.00,4,18,32,'朝南','住宅','sale',11500000.00,100000.00,'2024-09-08 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(44,1,NULL,NULL,NULL,'朝阳区工体北路8号',96.00,3,22,30,'南北通透','住宅','sale',9500000.00,98958.00,'2024-11-25 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(45,1,NULL,NULL,NULL,'朝阳区三里屯路19号',88.00,3,15,28,'朝南','住宅','sale',8700000.00,98864.00,'2025-01-12 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(46,1,NULL,NULL,NULL,'朝阳区东四环中路66号',102.00,3,10,35,'南北通透','住宅','sale',10200000.00,100000.00,'2025-03-28 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(47,1,NULL,NULL,NULL,'朝阳区望京街道望京西路',95.00,3,20,32,'朝南','住宅','sale',9600000.00,101053.00,'2025-05-14 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(48,1,NULL,NULL,NULL,'朝阳区酒仙桥路10号',88.00,3,8,25,'南北通透','住宅','sale',8900000.00,101136.00,'2025-07-22 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(49,1,NULL,NULL,NULL,'朝阳区建国路88号',120.00,4,25,38,'朝南','住宅','sale',12500000.00,104167.00,'2025-09-30 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(50,1,NULL,NULL,NULL,'朝阳区朝外大街甲6号',98.00,3,18,30,'南北通透','住宅','sale',10100000.00,103061.00,'2025-11-20 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(51,1,NULL,NULL,NULL,'朝阳区麦子店街道麦子店西路',92.00,3,12,28,'朝南','住宅','sale',9500000.00,103261.00,'2026-01-08 00:00:00','贝壳',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(52,1,NULL,NULL,NULL,'朝阳区朝阳北路101号',88.00,3,15,32,'南北通透','住宅','sale',9200000.00,104545.00,'2026-02-25 00:00:00','链家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(53,1,NULL,NULL,NULL,'朝阳区劲松街道劲松中街',105.00,3,20,35,'朝南','住宅','sale',11000000.00,104762.00,'2026-03-10 00:00:00','我爱我家',0,NULL,'2026-03-13 13:13:35','2026-03-13 13:13:35');
/*!40000 ALTER TABLE `cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cities`
--

DROP TABLE IF EXISTS `cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cities`
--

LOCK TABLES `cities` WRITE;
/*!40000 ALTER TABLE `cities` DISABLE KEYS */;
INSERT INTO `cities` VALUES (1,'北京','北京市','BJ',1,'2026-03-13 13:13:35'),(2,'上海','上海市','SH',1,'2026-03-13 13:13:35'),(3,'深圳','广东省','SZ',1,'2026-03-13 13:13:35'),(4,'广州','广东省','GZ',1,'2026-03-13 13:13:35'),(5,'杭州','浙江省','HZ',1,'2026-03-13 13:13:35');
/*!40000 ALTER TABLE `cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estates`
--

DROP TABLE IF EXISTS `estates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city_id` int NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `developer` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `build_year` int DEFAULT NULL,
  `property_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_units` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estates`
--

LOCK TABLES `estates` WRITE;
/*!40000 ALTER TABLE `estates` DISABLE KEYS */;
INSERT INTO `estates` VALUES (1,'万科俊园',1,'北京市朝阳区朝阳公园南路1号','万科地产',2015,'住宅',800,1,'2026-03-13 13:13:35'),(2,'中海紫御公馆',1,'北京市朝阳区东三环中路39号','中海地产',2018,'住宅',600,1,'2026-03-13 13:13:35'),(3,'保利中央公园',1,'北京市朝阳区来广营西路88号','保利地产',2016,'住宅',1200,1,'2026-03-13 13:13:35'),(4,'龙湖颐和原著',1,'北京市海淀区西北旺镇北清路','龙湖地产',2019,'住宅',400,1,'2026-03-13 13:13:35'),(5,'金茂府',1,'北京市朝阳区东坝乡','中国金茂',2020,'住宅',500,1,'2026-03-13 13:13:35'),(6,'华润橡树湾',1,'北京市昌平区回龙观镇','华润置地',2014,'住宅',2000,1,'2026-03-13 13:13:35'),(7,'绿城玉兰花园',1,'北京市海淀区温泉镇','绿城地产',2017,'住宅',350,1,'2026-03-13 13:13:35'),(8,'汤臣一品',2,'上海市浦东新区滨江大道3388号','汤臣集团',2006,'住宅',200,1,'2026-03-13 13:13:35'),(9,'中海御景熙岸',2,'上海市浦东新区张江高科技园区','中海地产',2019,'住宅',800,1,'2026-03-13 13:13:35'),(10,'万科翡翠滨江',2,'上海市黄浦区外滩','万科地产',2021,'住宅',300,1,'2026-03-13 13:13:35');
/*!40000 ALTER TABLE `estates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_user_id` int NOT NULL,
  `to_user_id` int NOT NULL,
  `project_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `related_id` int DEFAULT NULL,
  `related_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `openclaw_configs`
--

DROP TABLE IF EXISTS `openclaw_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `openclaw_configs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `api_key` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_city_ids` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `openclaw_configs`
--

LOCK TABLES `openclaw_configs` WRITE;
/*!40000 ALTER TABLE `openclaw_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `openclaw_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `openclaw_tasks`
--

DROP TABLE IF EXISTS `openclaw_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `openclaw_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_id` int NOT NULL,
  `city_id` int DEFAULT NULL,
  `status` enum('pending','running','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `total_count` int DEFAULT '0',
  `success_count` int DEFAULT '0',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `openclaw_tasks`
--

LOCK TABLES `openclaw_tasks` WRITE;
/*!40000 ALTER TABLE `openclaw_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `openclaw_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operation_logs`
--

DROP TABLE IF EXISTS `operation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operation_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` int DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `detail` text COLLATE utf8mb4_unicode_ci,
  `ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operation_logs`
--

LOCK TABLES `operation_logs` WRITE;
/*!40000 ALTER TABLE `operation_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `operation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `org_members`
--

DROP TABLE IF EXISTS `org_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `org_members`
--

LOCK TABLES `org_members` WRITE;
/*!40000 ALTER TABLE `org_members` DISABLE KEYS */;
INSERT INTO `org_members` VALUES (1,1,2,'admin','2026-03-13 13:13:35'),(2,2,3,'admin','2026-03-13 13:13:35'),(3,3,4,'admin','2026-03-13 13:13:35');
/*!40000 ALTER TABLE `org_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('appraiser','bank','investor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `license` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` decimal(3,1) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES (1,'中诚信房地产评估有限公司','appraiser',NULL,NULL,'张总','13800138001',NULL,NULL,NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(2,'建设银行北京分行','bank',NULL,NULL,'李行长','13900139001',NULL,NULL,NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:35'),(3,'中信证券投资部','investor',NULL,NULL,'王总监','13700137001',NULL,NULL,NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:35');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('bidding','active','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bidding',
  `client_id` int NOT NULL,
  `client_org_id` int DEFAULT NULL,
  `bank_org_id` int DEFAULT NULL,
  `bank_user_id` int DEFAULT NULL,
  `assigned_org_id` int DEFAULT NULL,
  `assigned_user_id` int DEFAULT NULL,
  `property_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` decimal(10,2) DEFAULT NULL,
  `estimated_value` decimal(15,2) DEFAULT NULL,
  `deadline` timestamp NULL DEFAULT NULL,
  `city_id` int DEFAULT NULL,
  `estate_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_project_no_unique` (`project_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report_files`
--

DROP TABLE IF EXISTS `report_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `file_name` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `uploaded_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report_files`
--

LOCK TABLES `report_files` WRITE;
/*!40000 ALTER TABLE `report_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_id` int NOT NULL,
  `title` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','submitted','reviewing','approved','rejected','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `author_id` int NOT NULL,
  `reviewer_id` int DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `property_address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property_area` decimal(10,2) DEFAULT NULL,
  `valuation_result` decimal(15,2) DEFAULT NULL,
  `valuation_min` decimal(15,2) DEFAULT NULL,
  `valuation_max` decimal(15,2) DEFAULT NULL,
  `final_value` decimal(15,2) DEFAULT NULL,
  `ai_review_result` text COLLATE utf8mb4_unicode_ci,
  `ai_score` int DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `rating_comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reports_report_no_unique` (`report_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `building_id` int NOT NULL,
  `estate_id` int NOT NULL,
  `unit_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` int DEFAULT NULL,
  `area` decimal(10,2) DEFAULT NULL,
  `rooms` int DEFAULT NULL,
  `bathrooms` int DEFAULT NULL,
  `orientation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT (now()),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,1,1,'0101',1,89.50,3,2,'南北通透','2026-03-13 13:13:35'),(2,1,1,'0102',1,120.30,4,2,'朝南','2026-03-13 13:13:35'),(3,1,1,'0201',2,89.50,3,2,'南北通透','2026-03-13 13:13:35'),(4,1,1,'0202',2,120.30,4,2,'朝南','2026-03-13 13:13:35'),(5,1,1,'1001',10,89.50,3,2,'南北通透','2026-03-13 13:13:35'),(6,1,1,'1002',10,120.30,4,2,'朝南','2026-03-13 13:13:35'),(7,1,1,'1501',15,89.50,3,2,'南北通透','2026-03-13 13:13:35'),(8,1,1,'1502',15,120.30,4,2,'朝南','2026-03-13 13:13:35'),(9,1,1,'2001',20,89.50,3,2,'南北通透','2026-03-13 13:13:35'),(10,1,1,'2002',20,120.30,4,2,'朝南','2026-03-13 13:13:35'),(11,1,1,'2501',25,89.50,3,2,'南北通透','2026-03-13 13:13:35'),(12,1,1,'2502',25,120.30,4,2,'朝南','2026-03-13 13:13:35'),(13,2,1,'0101',1,95.00,3,2,'朝南','2026-03-13 13:13:35'),(14,2,1,'1001',10,95.00,3,2,'朝南','2026-03-13 13:13:35'),(15,2,1,'2001',20,95.00,3,2,'朝南','2026-03-13 13:13:35'),(16,4,2,'0101',1,130.00,4,2,'南北通透','2026-03-13 13:13:35'),(17,4,2,'1001',10,130.00,4,2,'南北通透','2026-03-13 13:13:35'),(18,4,2,'2001',20,130.00,4,2,'南北通透','2026-03-13 13:13:35');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('appraiser','bank','investor','customer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `org_id` int DEFAULT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT (now()),
  `updated_at` timestamp NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_unique` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@gujia.app','13800000001','$2a$10$H6mbbvCuRMCKvAGtU2zScuILNmlft0Qr5hMAJYi.r051KiHTGXidO','admin',NULL,'系统管理员','管理员',NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:55'),(2,'appraiser1','appraiser1@zhongcheng.com','13811111111','$2a$10$whRpCA54fZoArgKWjiqsk.5fP9rlnUUfetq8zpkFHdhyd0OarCcXe','appraiser',1,'张评估师','张评',NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:55'),(3,'bank1','bank1@ccb.com','13822222222','$2a$10$whRpCA54fZoArgKWjiqsk.5fP9rlnUUfetq8zpkFHdhyd0OarCcXe','bank',2,'李银行员','李行',NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:55'),(4,'investor1','investor1@citic.com','13833333333','$2a$10$whRpCA54fZoArgKWjiqsk.5fP9rlnUUfetq8zpkFHdhyd0OarCcXe','investor',3,'王投资人','王总',NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:55'),(5,'customer1','customer1@example.com','13844444444','$2a$10$whRpCA54fZoArgKWjiqsk.5fP9rlnUUfetq8zpkFHdhyd0OarCcXe','customer',NULL,'陈客户','陈先生',NULL,1,'2026-03-13 13:13:35','2026-03-13 13:13:55');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'gujia'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-13 13:40:22
