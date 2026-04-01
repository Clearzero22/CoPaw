# CoPaw 跨境电商应用指南

> 针对跨境电商场景的专业应用指南，涵盖多语言客服、订单监控、价格追踪、业务分析等核心场景

## 📋 目录
1. [跨境电商场景分析](#跨境电商场景分析)
2. [核心应用场景](#核心应用场景)
3. [实现方案](#实现方案)
4. [自定义技能开发](#自定义技能开发)
5. [部署架构](#部署架构)
6. [最佳实践](#最佳实践)
7. [案例分析](#案例分析)

---

## 跨境电商场景分析

### 1.1 业务特点

跨境电商业务具有以下独特特征：

**多平台运营**
- 同时在 Amazon、eBay、Shopee、Lazada 等平台销售
- 需要统一管理多个平台的订单和客户
- 平台规则和API接口各不相同

**多语言支持**
- 客户来自不同国家和地区
- 需要实时翻译和本地化服务
- 时区差异导致24/7服务需求

**数据驱动决策**
- 需要实时监控竞品价格
- 分析销售趋势和库存状况
- 自动化报表生成

**合规要求**
- 不同国家的税务和法规要求
- 数据隐私保护（GDPR等）
- 平台政策合规

### 1.2 CoPaw 的优势

**多渠道整合**
```yaml
# 配置多个电商平台的Webhook
channels:
  amazon:
    type: webhook
    webhook_url: https:// copaw.example.com/webhook/amazon
    secret: "${AMAZON_WEBHOOK_SECRET}"

  ebay:
    type: webhook
    webhook_url: https://copaw.example.com/webhook/ebay
    secret: "${EBAY_WEBHOOK_SECRET}"

  shopee:
    type: webhook
    webhook_url: https://copaw.example.com/webhook/shopee
    secret: "${SHOPEE_WEBHOOK_SECRET}"
```

**多语言智能客服**
```python
# 自动检测客户语言并切换
class MultiLanguageCustomerService(ReActAgent):
    """多语言客服Agent"""

    async def detect_language(self, text: str) -> str:
        """检测客户消息语言"""
        # 使用语言检测工具
        result = await self.tool_manager.call_tool(
            "language_detection",
            text=text
        )
        return result["language"]

    async def respond_in_language(
        self,
        message: str,
        language: str
    ) -> str:
        """以指定语言回复"""
        if language == "zh":
            return await self._respond_chinese(message)
        elif language == "en":
            return await self._respond_english(message)
        elif language == "es":
            return await self._respond_spanish(message)
        else:
            # 使用翻译API
            return await self._translate_and_respond(
                message,
                target_lang=language
            )
```

---

## 核心应用场景

### 2.1 多语言智能客服

**场景描述**：
- 客户通过不同平台（Amazon、eBay等）咨询
- 客户使用不同语言（英语、西班牙语、日语等）
- 需要24/7不间断服务
- 要求快速、准确的回复

**CoPaw 实现**：

```python
# ~/.copaw/working/agents/default/active_skills/ecommerce_support/__init__.py

from agentscope.agents import ReActAgent
from agentscope.tools import tool

class EcommerceCustomerServiceAgent(ReActAgent):
    """电商客服Agent"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # 加载产品知识库
        self.product_knowledge = self._load_knowledge_base()

        # 加载常见问题
        self.faqs = self._load_faqs()

    @tool
    async def check_order_status(
        self,
        order_id: str,
        platform: str
    ) -> dict:
        """查询订单状态

        Args:
            order_id: 订单ID
            platform: 平台名称（amazon/ebay/shopee）

        Returns:
            订单状态信息
        """
        # 调用对应平台的API
        api_client = self._get_platform_client(platform)
        order_info = await api_client.get_order(order_id)

        return {
            "order_id": order_id,
            "status": order_info["status"],
            "tracking_number": order_info.get("tracking_number"),
            "estimated_delivery": order_info.get("estimated_delivery"),
            "items": order_info["items"]
        }

    @tool
    async def search_product_info(
        self,
        query: str,
        language: str = "en"
    ) -> list:
        """搜索产品信息

        Args:
            query: 搜索关键词
            language: 搜索语言

        Returns:
            产品列表
        """
        # 在产品知识库中搜索
        results = []
        for product in self.product_knowledge:
            if query.lower() in product["title"].lower():
                # 翻译产品信息到目标语言
                translated = await self._translate_product_info(
                    product,
                    language
                )
                results.append(translated)

        return results[:10]  # 返回前10个结果

    @tool
    async def handle_return_request(
        self,
        order_id: str,
        reason: str,
        platform: str
    ) -> dict:
        """处理退货请求

        Args:
            order_id: 订单ID
            reason: 退货原因
            platform: 平台名称

        Returns:
            退货处理结果
        """
        # 1. 验证订单是否可退货
        order = await self.check_order_status(order_id, platform)

        if order["status"] not in ["delivered", "shipped"]:
            return {
                "success": False,
                "message": "This order is not eligible for return"
            }

        # 2. 创建退货请求
        api_client = self._get_platform_client(platform)
        return_request = await api_client.create_return(
            order_id=order_id,
            reason=reason
        )

        # 3. 生成退货标签
        return_label = await self._generate_return_label(
            return_request
        )

        return {
            "success": True,
            "return_id": return_request["id"],
            "return_label": return_label,
            "instructions": self._get_return_instructions(language)
        }

    @tool
    async def provide_shipping_quote(
        self,
        destination: str,
        weight: float,
        dimensions: dict
    ) -> dict:
        """提供运费报价

        Args:
            destination: 目的地国家
            weight: 重量（kg）
            dimensions: 尺寸 {length, width, height}

        Returns:
            运费选项
        """
        # 调用物流API获取报价
        shipping_options = await self._get_shipping_quotes(
            destination,
            weight,
            dimensions
        )

        # 按价格排序
        shipping_options.sort(key=lambda x: x["price"])

        return {
            "options": shipping_options,
            "recommended": shipping_options[0] if shipping_options else None
        }

    def _load_knowledge_base(self) -> list:
        """加载产品知识库"""
        # 从文件或数据库加载
        import yaml

        with open(
            "~/.copaw/data/products.yaml",
            "r"
        ) as f:
            return yaml.safe_load(f)

    def _load_faqs(self) -> dict:
        """加载常见问题"""
        import json

        with open(
            "~/.copaw/data/ecommerce_faqs.json",
            "r"
        ) as f:
            return json.load(f)

    def _get_platform_client(self, platform: str):
        """获取平台API客户端"""
        # 返回对应平台的API客户端
        from platforms import AmazonAPI, EbayAPI, ShopeeAPI

        clients = {
            "amazon": AmazonAPI,
            "ebay": EbayAPI,
            "shopee": ShopeeAPI
        }

        return clients[platform]()

    async def _translate_product_info(
        self,
        product: dict,
        language: str
    ) -> dict:
        """翻译产品信息"""
        # 使用翻译API
        translated = product.copy()

        if language != "en":
            translated["title"] = await self._translate_text(
                product["title"],
                language
            )
            translated["description"] = await self._translate_text(
                product["description"],
                language
            )

        return translated

    async def _translate_text(
        self,
        text: str,
        target_lang: str
    ) -> str:
        """翻译文本"""
        # 使用翻译工具
        result = await self.tool_manager.call_tool(
            "translation",
            text=text,
            target_lang=target_lang
        )
        return result["translated_text"]

    async def _generate_return_label(
        self,
        return_request: dict
    ) -> str:
        """生成退货标签"""
        # 调用物流API生成退货标签
        return f"label_{return_request['id']}.pdf"

    def _get_return_instructions(
        self,
        language: str
    ) -> str:
        """获取退货说明"""
        instructions = {
            "en": "Please package the item securely...",
            "zh": "请妥善包装商品...",
            "es": "Por favor, empaquete el artículo...",
            "ja": "商品を適切に梱包してください..."
        }
        return instructions.get(language, instructions["en"])

    async def _get_shipping_quotes(
        self,
        destination: str,
        weight: float,
        dimensions: dict
    ) -> list:
        """获取运费报价"""
        # 调用物流API
        # 返回多个物流选项
        return [
            {
                "provider": "DHL",
                "service": "Express",
                "price": 25.99,
                "delivery_days": 3-5
            },
            {
                "provider": "FedEx",
                "service": "International Economy",
                "price": 22.50,
                "delivery_days": 5-7
            },
            {
                "provider": "UPS",
                "service": "Standard",
                "price": 20.00,
                "delivery_days": 7-10
            }
        ]
```

**配置文件**：

```yaml
# ~/.copaw/agents/ecommerce_service.yaml

name: ecommerce_service
description: Multi-language customer service for e-commerce

model:
  model_name: gpt-4
  temperature: 0.7

memory:
  max_memories: 100
  auto_compact: true

tools:
  - check_order_status
  - search_product_info
  - handle_return_request
  - provide_shipping_quote
  - language_detection
  - translation

prompt_template: |
  You are a professional e-commerce customer service agent.

  Your responsibilities:
  1. Provide quick and accurate responses to customer inquiries
  2. Detect the customer's language and respond in the same language
  3. Help with order status, product information, returns, and shipping quotes
  4. Maintain a friendly and professional tone

  Customer message: {message}

  Think step by step and provide helpful responses.
```

### 2.2 订单监控与处理

**场景描述**：
- 实时监控多个平台的新订单
- 自动处理订单确认
- 库存检查和预警
- 物流信息更新

**CoPaw 实现**：

```python
# ~/.copaw/working/agents/default/active_skills/order_monitor/__init__.py

import asyncio
from datetime import datetime
from typing import Dict, List

class OrderMonitoringAgent(ReActAgent):
    """订单监控Agent"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # 监控的平台
        self.monitored_platforms = [
            "amazon",
            "ebay",
            "shopee",
            "lazada"
        ]

        # 监控间隔（秒）
        self.check_interval = 300  # 5分钟

    @tool
    async def check_new_orders(
        self,
        platform: str,
        since: str = None
    ) -> List[dict]:
        """检查新订单

        Args:
            platform: 平台名称
            since: 检查起始时间（ISO格式）

        Returns:
            新订单列表
        """
        api_client = self._get_platform_client(platform)

        # 获取新订单
        new_orders = await api_client.get_orders(
            created_since=since or self._last_check_time(platform)
        )

        # 处理每个订单
        for order in new_orders:
            await self._process_new_order(order, platform)

        # 更新最后检查时间
        self._update_last_check_time(platform)

        return new_orders

    @tool
    async def verify_inventory(
        self,
        order_items: List[dict]
    ) -> dict:
        """验证库存

        Args:
            order_items: 订单商品列表

        Returns:
            库存验证结果
        """
        inventory_issues = []

        for item in order_items:
            product_id = item["product_id"]
            quantity = item["quantity"]

            # 检查库存
            available = await self._check_inventory(product_id)

            if available < quantity:
                inventory_issues.append({
                    "product_id": product_id,
                    "requested": quantity,
                    "available": available,
                    "shortage": quantity - available
                })

        return {
            "has_issues": len(inventory_issues) > 0,
            "issues": inventory_issues
        }

    @tool
    async def calculate_shipping(
        self,
        order: dict,
        platform: str
    ) -> dict:
        """计算运费

        Args:
            order: 订单信息
            platform: 平台名称

        Returns:
            运费信息
        """
        # 获取订单信息
        destination = order["shipping_address"]["country"]
        weight = self._calculate_total_weight(order["items"])
        dimensions = self._calculate_total_dimensions(order["items"])

        # 获取运费报价
        quotes = await self._get_shipping_quotes(
            destination,
            weight,
            dimensions
        )

        # 根据平台规则选择合适的物流
        selected = self._select_shipping_option(
            quotes,
            platform,
            order.get("shipping_method")
        )

        return {
            "quotes": quotes,
            "selected": selected,
            "total_shipping_cost": selected["price"]
        }

    @tool
    async def confirm_order(
        self,
        order_id: str,
        platform: str
    ) -> dict:
        """确认订单

        Args:
            order_id: 订单ID
            platform: 平台名称

        Returns:
            确认结果
        """
        api_client = self._get_platform_client(platform)

        # 1. 验证库存
        order = await api_client.get_order(order_id)
        inventory_check = await self.verify_inventory(order["items"])

        if inventory_check["has_issues"]:
            return {
                "success": False,
                "message": "Insufficient inventory",
                "issues": inventory_check["issues"]
            }

        # 2. 计算运费
        shipping = await self.calculate_shipping(order, platform)

        # 3. 确认订单
        confirmation = await api_client.confirm_order(
            order_id,
            shipping_info=shipping["selected"]
        )

        # 4. 通知仓库
        await self._notify_warehouse(order, shipping)

        # 5. 更新库存
        await self._update_inventory(order["items"])

        # 6. 发送确认邮件
        await self._send_confirmation_email(order)

        return {
            "success": True,
            "confirmation": confirmation,
            "shipping": shipping
        }

    @tool
    async def monitor_order_status(
        self,
        order_id: str,
        platform: str
    ) -> dict:
        """监控订单状态

        Args:
            order_id: 订单ID
            platform: 平台名称

        Returns:
            订单状态和更新
        """
        api_client = self._get_platform_client(platform)

        # 获取最新状态
        order = await api_client.get_order(order_id)

        # 检查状态变化
        previous_status = self._get_cached_status(order_id)
        current_status = order["status"]

        updates = []
        if previous_status != current_status:
            # 状态发生变化
            update = {
                "order_id": order_id,
                "previous_status": previous_status,
                "current_status": current_status,
                "timestamp": datetime.now().isoformat()
            }

            # 根据状态变化触发相应操作
            if current_status == "shipped":
                await self._handle_order_shipped(order)
            elif current_status == "delivered":
                await self._handle_order_delivered(order)
            elif current_status == "cancelled":
                await self._handle_order_cancelled(order)

            updates.append(update)

        # 更新缓存
        self._cache_status(order_id, current_status)

        return {
            "order_id": order_id,
            "status": current_status,
            "tracking": order.get("tracking_info"),
            "updates": updates
        }

    @tool
    async def generate_daily_report(
        self,
        date: str = None
    ) -> dict:
        """生成日报表

        Args:
            date: 日期（YYYY-MM-DD格式）

        Returns:
            日报表数据
        """
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")

        # 收集所有平台的数据
        report_data = {
            "date": date,
            "platforms": {}
        }

        for platform in self.monitored_platforms:
            api_client = self._get_platform_client(platform)

            # 获取当日订单
            orders = await api_client.get_orders_by_date(date)

            # 统计数据
            platform_data = {
                "total_orders": len(orders),
                "total_revenue": sum(o["total"] for o in orders),
                "pending": len([o for o in orders if o["status"] == "pending"]),
                "shipped": len([o for o in orders if o["status"] == "shipped"]),
                "delivered": len([o for o in orders if o["status"] == "delivered"]),
                "top_products": self._get_top_products(orders),
                "countries": self._get_order_distribution(orders)
            }

            report_data["platforms"][platform] = platform_data

        # 生成汇总
        report_data["summary"] = self._generate_summary(report_data)

        return report_data

    async def _process_new_order(
        self,
        order: dict,
        platform: str
    ):
        """处理新订单"""
        logger.info(f"Processing new order {order['id']} from {platform}")

        # 1. 发送订单确认通知
        await self._send_order_notification(order)

        # 2. 检查库存
        inventory_check = await self.verify_inventory(order["items"])

        if inventory_check["has_issues"]:
            # 库存不足，发送预警
            await self._send_inventory_alert(
                order,
                inventory_check["issues"]
            )
            return

        # 3. 自动确认订单（如果配置了）
        if self._should_auto_confirm(platform):
            await self.confirm_order(order["id"], platform)

    async def _handle_order_shipped(self, order: dict):
        """处理订单已发货"""
        # 发送发货通知
        await self._send_shipping_notification(order)

        # 更新CRM系统
        await self._update_crm_status(
            order["id"],
            "shipped"
        )

    async def _handle_order_delivered(self, order: dict):
        """处理订单已送达"""
        # 发送送达通知
        await self._send_delivery_notification(order)

        # 请求评价
        await self._request_review(order)

    async def _handle_order_cancelled(self, order: dict):
        """处理订单已取消"""
        # 恢复库存
        await self._restore_inventory(order["items"])

        # 发送取消通知
        await self._send_cancellation_notification(order)

    def _calculate_total_weight(
        self,
        items: List[dict]
    ) -> float:
        """计算总重量"""
        return sum(
            item["weight"] * item["quantity"]
            for item in items
        )

    def _calculate_total_dimensions(
        self,
        items: List[dict]
    ) -> dict:
        """计算总体积"""
        # 简化计算，实际需要更复杂的算法
        return {
            "length": max(i.get("length", 0) for i in items),
            "width": max(i.get("width", 0) for i in items),
            "height": sum(i.get("height", 0) for i in items)
        }

    def _select_shipping_option(
        self,
        quotes: List[dict],
        platform: str,
        preferred_method: str = None
    ) -> dict:
        """选择物流方案"""
        # 根据平台规则和客户偏好选择
        if preferred_method:
            for quote in quotes:
                if quote["service"].lower() == preferred_method.lower():
                    return quote

        # 默认选择性价比最高的
        return quotes[0] if quotes else None

    async def _notify_warehouse(
        self,
        order: dict,
        shipping: dict
    ):
        """通知仓库"""
        # 发送仓库管理系统
        pass

    async def _update_inventory(self, items: List[dict]):
        """更新库存"""
        for item in items:
            await self._decrease_inventory(
                item["product_id"],
                item["quantity"]
            )

    async def _send_confirmation_email(self, order: dict):
        """发送确认邮件"""
        # 使用邮件工具发送
        pass

    def _get_top_products(self, orders: List[dict]) -> list:
        """获取热销产品"""
        product_sales = {}

        for order in orders:
            for item in order["items"]:
                product_id = item["product_id"]
                product_sales[product_id] = product_sales.get(
                    product_id,
                    0
                ) + item["quantity"]

        # 排序并返回前10
        sorted_products = sorted(
            product_sales.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return sorted_products[:10]

    def _get_order_distribution(
        self,
        orders: List[dict]
    ) -> dict:
        """获取订单地区分布"""
        countries = {}

        for order in orders:
            country = order["shipping_address"]["country"]
            countries[country] = countries.get(country, 0) + 1

        return countries

    def _generate_summary(self, report_data: dict) -> dict:
        """生成汇总数据"""
        total_orders = sum(
            p["total_orders"]
            for p in report_data["platforms"].values()
        )
        total_revenue = sum(
            p["total_revenue"]
            for p in report_data["platforms"].values()
        )

        return {
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "average_order_value": total_revenue / total_orders if total_orders > 0 else 0
        }
```

### 2.3 竞品价格监控

**场景描述**：
- 监控竞争对手的产品价格
- 自动调整自己的定价策略
- 识别价格趋势和促销活动
- 生成价格分析报告

**CoPaw 实现**：

```python
# ~/.copaw/working/agents/default/active_skills/price_monitor/__init__.py

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List

class PriceMonitoringAgent(ReActAgent):
    """价格监控Agent"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # 监控的产品列表
        self.monitored_products = self._load_monitored_products()

        # 监控的竞争对手
        self.competitors = [
            "competitor_a",
            "competitor_b",
            "competitor_c"
        ]

    @tool
    async def check_competitor_prices(
        self,
        product_id: str
    ) -> List[dict]:
        """检查竞品价格

        Args:
            product_id: 产品ID

        Returns:
            竞品价格列表
        """
        prices = []

        for competitor in self.competitors:
            try:
                # 获取竞品价格
                price_info = await self._fetch_competitor_price(
                    competitor,
                    product_id
                )

                if price_info:
                    prices.append({
                        "competitor": competitor,
                        "price": price_info["price"],
                        "currency": price_info["currency"],
                        "availability": price_info["availability"],
                        "timestamp": datetime.now().isoformat()
                    })
            except Exception as e:
                logger.error(
                    f"Failed to fetch price from {competitor}: {e}"
                )

        # 保存价格历史
        await self._save_price_history(product_id, prices)

        return prices

    @tool
    async def analyze_price_trends(
        self,
        product_id: str,
        days: int = 30
    ) -> dict:
        """分析价格趋势

        Args:
            product_id: 产品ID
            days: 分析天数

        Returns:
            价格趋势分析
        """
        # 获取历史价格数据
        history = await self._get_price_history(
            product_id,
            days=days
        )

        # 计算统计数据
        analysis = {
            "product_id": product_id,
            "period_days": days,
            "statistics": {}
        }

        for competitor in self.competitors:
            competitor_data = [
                p for p in history
                if p["competitor"] == competitor
            ]

            if competitor_data:
                prices = [p["price"] for p in competitor_data]

                analysis["statistics"][competitor] = {
                    "min": min(prices),
                    "max": max(prices),
                    "average": sum(prices) / len(prices),
                    "current": prices[-1],
                    "change_percent": (
                        (prices[-1] - prices[0]) / prices[0] * 100
                        if len(prices) > 1 and prices[0] > 0
                        else 0
                    )
                }

        # 识别趋势
        analysis["trend"] = self._identify_trend(analysis)

        # 检测异常
        analysis["anomalies"] = self._detect_anomalies(history)

        return analysis

    @tool
    async def suggest_pricing_strategy(
        self,
        product_id: str
    ) -> dict:
        """建议定价策略

        Args:
            product_id: 产品ID

        Returns:
            定价建议
        """
        # 获取当前价格
        current_prices = await self.check_competitor_prices(product_id)

        # 获取趋势分析
        trends = await self.analyze_price_trends(product_id)

        # 获取产品信息
        product_info = await self._get_product_info(product_id)

        # 计算建议价格
        suggested_price = self._calculate_suggested_price(
            current_prices,
            trends,
            product_info
        )

        # 生成建议
        strategy = {
            "product_id": product_id,
            "current_price": product_info.get("current_price"),
            "suggested_price": suggested_price,
            "reasoning": self._generate_pricing_reasoning(
                current_prices,
                trends,
                product_info
            ),
            "competitor_positions": self._analyze_positions(
                suggested_price,
                current_prices
            )
        }

        return strategy

    @tool
    async def detect_price_changes(
        self,
        threshold: float = 5.0
    ) -> List[dict]:
        """检测价格变化

        Args:
            threshold: 变化阈值（百分比）

        Returns:
            价格变化列表
        """
        changes = []

        for product_id in self.monitored_products:
            # 获取最新价格
            latest_prices = await self.check_competitor_prices(product_id)

            # 获取上一次价格
            previous_prices = await self._get_previous_prices(product_id)

            # 比较价格
            for latest in latest_prices:
                competitor = latest["competitor"]
                previous = next(
                    (p for p in previous_prices
                     if p["competitor"] == competitor),
                    None
                )

                if previous:
                    change_percent = (
                        (latest["price"] - previous["price"])
                        / previous["price"] * 100
                        if previous["price"] > 0
                        else 0
                    )

                    if abs(change_percent) >= threshold:
                        changes.append({
                            "product_id": product_id,
                            "competitor": competitor,
                            "previous_price": previous["price"],
                            "current_price": latest["price"],
                            "change_percent": change_percent,
                            "timestamp": datetime.now().isoformat()
                        })

        # 发送通知
        if changes:
            await self._send_price_change_alert(changes)

        return changes

    @tool
    async def generate_price_report(
        self,
        date: str = None
    ) -> dict:
        """生成价格报告

        Args:
            date: 日期（YYYY-MM-DD格式）

        Returns:
            价格报告
        """
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")

        report = {
            "date": date,
            "products": {}
        }

        for product_id in self.monitored_products:
            # 获取价格数据
            prices = await self.check_competitor_prices(product_id)
            trends = await self.analyze_price_trends(product_id)
            strategy = await self.suggest_pricing_strategy(product_id)

            report["products"][product_id] = {
                "current_prices": prices,
                "trends": trends,
                "strategy": strategy
            }

        # 生成汇总
        report["summary"] = self._generate_price_summary(report)

        return report

    async def _fetch_competitor_price(
        self,
        competitor: str,
        product_id: str
    ) -> dict:
        """获取竞品价格"""
        # 根据竞争对手使用不同的抓取策略
        if competitor == "amazon":
            return await self._fetch_amazon_price(product_id)
        elif competitor == "ebay":
            return await self._fetch_ebay_price(product_id)
        else:
            return await self._fetch_generic_price(
                competitor,
                product_id
            )

    async def _fetch_amazon_price(
        self,
        product_id: str
    ) -> dict:
        """抓取Amazon价格"""
        # 使用Amazon API或网页抓取
        # 这里使用简化的示例
        import httpx

        async with httpx.AsyncClient() as client:
            # 实际实现需要处理Amazon的反爬机制
            response = await client.get(
                f"https://www.amazon.com/dp/{product_id}",
                headers={
                    "User-Agent": "Mozilla/5.0..."
                }
            )

            # 解析HTML获取价格
            # ...

        return {
            "price": 29.99,
            "currency": "USD",
            "availability": "In Stock"
        }

    def _calculate_suggested_price(
        self,
        current_prices: List[dict],
        trends: dict,
        product_info: dict
    ) -> float:
        """计算建议价格"""
        if not current_prices:
            return product_info.get("current_price", 0)

        # 获取所有价格
        prices = [p["price"] for p in current_prices]

        # 计算平均价格
        average_price = sum(prices) / len(prices)

        # 考虑成本
        cost = product_info.get("cost", 0)
        min_price = cost * 1.2  # 最小利润率20%

        # 定价策略：略低于平均价格
        suggested = average_price * 0.95

        # 确保不低于最低价格
        suggested = max(suggested, min_price)

        # 考虑趋势
        # 如果价格呈下降趋势，建议更激进的价格
        if trends.get("trend") == "downward":
            suggested *= 0.98

        return round(suggested, 2)

    def _generate_pricing_reasoning(
        self,
        current_prices: List[dict],
        trends: dict,
        product_info: dict
    ) -> str:
        """生成定价理由"""
        reasons = []

        if current_prices:
            avg_price = sum(p["price"] for p in current_prices) / len(current_prices)
            reasons.append(f"Competitor average price is ${avg_price:.2f}")

        if trends.get("trend") == "downward":
            reasons.append("Prices are trending down, suggesting competitive pricing")
        elif trends.get("trend") == "upward":
            reasons.append("Prices are trending up, room for higher pricing")

        if product_info.get("cost"):
            margin = (product_info["current_price"] - product_info["cost"]) / product_info["cost"] * 100
            reasons.append(f"Current margin is {margin:.1f}%")

        return "; ".join(reasons)

    def _analyze_positions(
        self,
        our_price: float,
        competitor_prices: List[dict]
    ) -> dict:
        """分析价格定位"""
        if not competitor_prices:
            return {}

        prices = [p["price"] for p in competitor_prices]
        prices.sort()

        # 找到我们的价格位置
        position = 0
        for i, price in enumerate(prices):
            if our_price <= price:
                position = i
                break
        else:
            position = len(prices)

        return {
            "position": position + 1,
            "total": len(prices),
            "percentile": (position + 1) / len(prices) * 100
        }
```

### 2.4 业务数据分析

**场景描述**：
- 销售数据统计和分析
- 客户行为分析
- 市场趋势预测
- 自动化报表生成

**CoPaw 实现**：

```python
# ~/.copaw/working/agents/default/active_skills/business_analytics/__init__.py

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List
import json

class BusinessAnalyticsAgent(ReActAgent):
    """业务分析Agent"""

    @tool
    async def generate_sales_report(
        self,
        start_date: str,
        end_date: str,
        platforms: List[str] = None
    ) -> dict:
        """生成销售报表

        Args:
            start_date: 开始日期
            end_date: 结束日期
            platforms: 平台列表

        Returns:
            销售报表
        """
        if not platforms:
            platforms = ["amazon", "ebay", "shopee"]

        report = {
            "period": {
                "start": start_date,
                "end": end_date
            },
            "platforms": {}
        }

        # 收集各平台数据
        for platform in platforms:
            platform_data = await self._get_platform_sales(
                platform,
                start_date,
                end_date
            )
            report["platforms"][platform] = platform_data

        # 生成汇总
        report["summary"] = self._generate_sales_summary(report)

        # 生成图表数据
        report["charts"] = self._generate_chart_data(report)

        return report

    @tool
    async def analyze_customer_behavior(
        self,
        customer_id: str
    ) -> dict:
        """分析客户行为

        Args:
            customer_id: 客户ID

        Returns:
            客户行为分析
        """
        # 获取客户订单历史
        orders = await self._get_customer_orders(customer_id)

        # 获取客户咨询历史
        inquiries = await self._get_customer_inquiries(customer_id)

        # 分析购买模式
        purchase_patterns = self._analyze_purchase_patterns(orders)

        # 分析偏好
        preferences = self._analyze_preferences(orders)

        # 预测未来行为
        predictions = self._predict_customer_behavior(
            orders,
            inquiries
        )

        return {
            "customer_id": customer_id,
            "total_orders": len(orders),
            "total_spent": sum(o["total"] for o in orders),
            "average_order_value": sum(o["total"] for o in orders) / len(orders) if orders else 0,
            "purchase_patterns": purchase_patterns,
            "preferences": preferences,
            "predictions": predictions,
            "recommendations": self._generate_recommendations(
                purchase_patterns,
                preferences
            )
        }

    @tool
    async def forecast_demand(
        self,
        product_id: str,
        days: int = 30
    ) -> dict:
        """预测需求

        Args:
            product_id: 产品ID
            days: 预测天数

        Returns:
            需求预测
        """
        # 获取历史销售数据
        historical_sales = await self._get_historical_sales(
            product_id,
            days=90  # 使用过去90天的数据
        )

        # 获取季节性数据
        seasonal_data = await self._get_seasonal_data(product_id)

        # 获取趋势数据
        trend_data = await self._get_trend_data(product_id)

        # 应用预测模型
        forecast = self._apply_forecasting_model(
            historical_sales,
            seasonal_data,
            trend_data
        )

        return {
            "product_id": product_id,
            "forecast_period_days": days,
            "daily_forecast": forecast,
            "total_forecast": sum(forecast),
            "confidence_interval": self._calculate_confidence_interval(
                forecast,
                historical_sales
            ),
            "recommendations": self._generate_inventory_recommendations(
                forecast
            )
        }

    @tool
    async def analyze_market_trends(
        self,
        category: str,
        days: int = 30
    ) -> dict:
        """分析市场趋势

        Args:
            category: 产品类别
            days: 分析天数

        Returns:
            市场趋势分析
        """
        # 获取类别销售数据
        category_sales = await self._get_category_sales(
            category,
            days=days
        )

        # 获取热门产品
        top_products = await self._get_top_products(category, days)

        # 获取新趋势
        emerging_trends = await self._identify_emerging_trends(
            category,
            days
        )

        # 获取价格趋势
        price_trends = await self._analyze_category_price_trends(
            category,
            days
        )

        return {
            "category": category,
            "period_days": days,
            "sales_trend": self._calculate_trend(category_sales),
            "top_products": top_products,
            "emerging_trends": emerging_trends,
            "price_trends": price_trends,
            "opportunities": self._identify_opportunities(
                top_products,
                emerging_trends
            )
        }

    @tool
    async def generate_inventory_report(
        self,
        threshold: float = 0.2
    ) -> dict:
        """生成库存报告

        Args:
            threshold: 库存预警阈值（20%）

        Returns:
            库存报告
        """
        # 获取所有产品库存
        inventory = await self._get_all_inventory()

        # 分析库存状况
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_products": len(inventory),
            "low_stock": [],
            "out_of_stock": [],
            "overstock": [],
            "healthy": []
        }

        for item in inventory:
            stock_level = item["current_stock"] / item["max_stock"]

            if stock_level == 0:
                report["out_of_stock"].append(item)
            elif stock_level <= threshold:
                report["low_stock"].append(item)
            elif stock_level > 1.5:  # 超过150%
                report["overstock"].append(item)
            else:
                report["healthy"].append(item)

        # 生成建议
        report["recommendations"] = self._generate_inventory_recommendations(
            report
        )

        return report

    def _analyze_purchase_patterns(
        self,
        orders: List[dict]
    ) -> dict:
        """分析购买模式"""
        if not orders:
            return {}

        # 购买频率
        order_dates = [o["date"] for o in orders]
        order_dates.sort()

        if len(order_dates) > 1:
            intervals = [
                (order_dates[i+1] - order_dates[i]).days
                for i in range(len(order_dates)-1)
            ]
            avg_frequency = sum(intervals) / len(intervals)
        else:
            avg_frequency = 0

        # 购买时间偏好
        purchase_hours = [o["date"].hour for o in orders]
        peak_hour = max(set(purchase_hours), key=purchase_hours.count)

        # 平均订单价值
        avg_order_value = sum(o["total"] for o in orders) / len(orders)

        return {
            "total_orders": len(orders),
            "avg_frequency_days": avg_frequency,
            "peak_hour": peak_hour,
            "avg_order_value": avg_order_value,
            "preferred_categories": self._get_preferred_categories(orders)
        }

    def _predict_customer_behavior(
        self,
        orders: List[dict],
        inquiries: List[dict]
    ) -> dict:
        """预测客户行为"""
        predictions = {
            "likely_to_purchase": False,
            "estimated_purchase_date": None,
            "likely_categories": [],
            "churn_risk": "low"
        }

        if not orders:
            return predictions

        # 预测下次购买时间
        last_order = max(orders, key=lambda o: o["date"])
        days_since_last = (datetime.now() - last_order["date"]).days

        # 基于历史频率预测
        if len(orders) >= 2:
            order_intervals = []
            sorted_orders = sorted(orders, key=lambda o: o["date"])
            for i in range(len(sorted_orders)-1):
                interval = (
                    sorted_orders[i+1]["date"] -
                    sorted_orders[i]["date"]
                ).days
                order_intervals.append(interval)

            avg_interval = sum(order_intervals) / len(order_intervals)

            if days_since_last >= avg_interval * 0.8:
                predictions["likely_to_purchase"] = True
                predictions["estimated_purchase_date"] = (
                    datetime.now() +
                    timedelta(days=avg_interval - days_since_last)
                ).strftime("%Y-%m-%d")

        # 预测感兴趣类别
        predictions["likely_categories"] = self._get_preferred_categories(orders)

        # 评估流失风险
        if days_since_last > 90:  # 90天未购买
            predictions["churn_risk"] = "high"
        elif days_since_last > 60:
            predictions["churn_risk"] = "medium"

        return predictions

    def _apply_forecasting_model(
        self,
        historical_sales: List[int],
        seasonal_data: dict,
        trend_data: dict
    ) -> List[int]:
        """应用预测模型"""
        # 简化的预测模型
        # 实际应用中可以使用ARIMA、Prophet等

        if not historical_sales:
            return []

        # 计算移动平均
        window = 7
        if len(historical_sales) >= window:
            moving_avg = sum(historical_sales[-window:]) / window
        else:
            moving_avg = sum(historical_sales) / len(historical_sales)

        # 应用趋势
        if trend_data.get("trend") == "increasing":
            moving_avg *= 1.05
        elif trend_data.get("trend") == "decreasing":
            moving_avg *= 0.95

        # 应用季节性
        seasonal_factor = seasonal_data.get("current_factor", 1.0)
        moving_avg *= seasonal_factor

        # 生成30天预测
        forecast = [int(moving_avg) for _ in range(30)]

        return forecast

    def _identify_emerging_trends(
        self,
        category: str,
        days: int
    ) -> List[dict]:
        """识别新兴趋势"""
        # 获取最近的数据
        recent_data = asyncio.run(self._get_category_sales(
            category,
            days=7
        ))

        # 获取稍早的数据
        earlier_data = asyncio.run(self._get_category_sales(
            category,
            days=days
        ))

        # 比较增长率
        trends = []
        for product_id in recent_data:
            recent_sales = recent_data[product_id]
            earlier_sales = earlier_data.get(product_id, 0)

            if earlier_sales > 0:
                growth_rate = (
                    (recent_sales - earlier_sales) / earlier_sales
                )

                if growth_rate > 0.5:  # 增长超过50%
                    trends.append({
                        "product_id": product_id,
                        "growth_rate": growth_rate,
                        "recent_sales": recent_sales
                    })

        # 按增长率排序
        trends.sort(key=lambda x: x["growth_rate"], reverse=True)

        return trends[:10]
```

---

## 实现方案

### 3.1 系统架构

**推荐部署架构**：

```yaml
# docker-compose.yml
version: '3.8'

services:
  copaw-core:
    image: copaw:latest
    container_name: copaw-core
    environment:
      - LOG_LEVEL=info
      - COPAW_WORKSPACE=/workspace
    volumes:
      - copaw-data:/workspace
      - copaw-logs:/logs
    ports:
      - "8088:8088"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: copaw-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: copaw-db
    environment:
      - POSTGRES_DB=copaw
      - POSTGRES_USER=copaw
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: copaw-nginx
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - copaw-core
    restart: unless-stopped

volumes:
  copaw-data:
  copaw-logs:
  postgres-data:
```

### 3.2 全球部署方案

**多区域部署**：

```
                    ┌─────────────┐
                    │   CDN/WAF   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌───▼────┐  ┌───▼────┐
         │  US East│  │Europe  │  │Asia    │
         │         │  │        │  │        │
         │CoPaw    │  │CoPaw   │  │CoPaw   │
         │Agent    │  │Agent   │  │Agent   │
         └────┬────┘  └───┬────┘  └───┬────┘
              │           │           │
              └───────────┼───────────┘
                          │
                    ┌─────▼─────┐
                    │  Central   │
                    │  Database  │
                    └───────────┘
```

**配置示例**：

```python
# ~/.copaw/config/regions.yaml

regions:
  us-east:
    name: "US East"
    location: "Virginia"
    timezone: "America/New_York"
    servers:
      - host: "us-copaw-1.example.com"
        port: 8088
    models:
      - provider: "openai"
        model: "gpt-4"
        api_key: "${OPENAI_API_KEY}"

  europe:
    name: "Europe"
    location: "Frankfurt"
    timezone: "Europe/Berlin"
    servers:
      - host: "eu-copaw-1.example.com"
        port: 8088
    models:
      - provider: "openai"
        model: "gpt-4"
        api_key: "${OPENAI_API_KEY}"

  asia:
    name: "Asia"
    location: "Singapore"
    timezone: "Asia/Singapore"
    servers:
      - host: "asia-copaw-1.example.com"
        port: 8088
    models:
      - provider: "openai"
        model: "gpt-4"
        api_key: "${OPENAI_API_KEY}"

load_balancing:
  strategy: "geographic"
  fallback: true
```

---

## 自定义技能开发

### 4.1 电商技能模板

**技能结构**：

```
~/.copaw/working/agents/default/active_skills/
└── ecommerce_custom/
    ├── SKILL.md
    ├── __init__.py
    ├── tools.py
    ├── agents.py
    └── config.yaml
```

**SKILL.md**：

```markdown
---
name: ecommerce_custom
description: Custom e-commerce skills for specific business needs
version: 1.0.0
author: Your Name
---

# E-commerce Custom Skills

Custom skills for e-commerce operations.

## Features

- Custom order processing logic
- Integration with internal systems
- Custom analytics and reporting

## Tools

### `process_custom_order`
Process orders with custom business logic.

### `sync_inventory`
Sync inventory with external system.

### `generate_custom_report`
Generate custom business reports.

## Configuration

Edit `config.yaml` to customize behavior.
```

### 4.2 平台集成示例

**Amazon集成**：

```python
# platforms/amazon.py

import boto3
from typing import Dict, List

class AmazonIntegration:
    """Amazon平台集成"""

    def __init__(
        self,
        seller_id: str,
        access_key: str,
        secret_key: str
    ):
        self.seller_id = seller_id
        self.access_key = access_key
        self.secret_key = secret_key

        # 初始化SP-API客户端
        self.client = boto3.client(
            'sellingpartnerapi',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='us-east-1'
        )

    async def get_orders(
        self,
        created_after: str = None
    ) -> List[dict]:
        """获取订单列表"""
        response = self.client.get_orders(
            SellerId=self.seller_id,
            CreatedAfter=created_after
        )
        return response.get('Orders', [])

    async def get_order(
        self,
        order_id: str
    ) -> dict:
        """获取订单详情"""
        response = self.client.get_order(
            SellerId=self.seller_id,
            AmazonOrderId=order_id
        )
        return response

    async def update_inventory(
        self,
        inventory: List[dict]
    ) -> dict:
        """更新库存"""
        response = self.client.submit_feed(
            SellerId=self.seller_id,
            FeedType='_POST_INVENTORY_AVAILABILITY_DATA_',
            FeedContent=self._format_inventory_feed(inventory)
        )
        return response

    async def update_price(
        self,
        price_updates: List[dict]
    ) -> dict:
        """更新价格"""
        response = self.client.submit_feed(
            SellerId=self.seller_id,
            FeedType='_POST_PRODUCT_PRICING_DATA_',
            FeedContent=self._format_pricing_feed(price_updates)
        )
        return response
```

---

## 最佳实践

### 5.1 性能优化

**缓存策略**：

```python
from functools import lru_cache
import asyncio

class CachedEcommerceAgent(ReActAgent):
    """带缓存的电商Agent"""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Redis缓存客户端
        self.cache_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )

    async def get_product_info(
        self,
        product_id: str
    ) -> dict:
        """获取产品信息（带缓存）"""
        # 检查缓存
        cache_key = f"product:{product_id}"
        cached = self.cache_client.get(cache_key)

        if cached:
            return json.loads(cached)

        # 从数据库获取
        product_info = await self._fetch_product_from_db(product_id)

        # 写入缓存（1小时）
        self.cache_client.setex(
            cache_key,
            3600,
            json.dumps(product_info)
        )

        return product_info
```

### 5.2 错误处理

**重试机制**：

```python
from tenacity import retry, stop_after_attempt, wait_exponential

class ResilientEcommerceAgent(ReActAgent):
    """带重试机制的电商Agent"""

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def call_platform_api(
        self,
        platform: str,
        endpoint: str,
        **kwargs
    ) -> dict:
        """调用平台API（带重试）"""
        try:
            client = self._get_platform_client(platform)
            return await client.call(endpoint, **kwargs)
        except Exception as e:
            logger.error(f"API call failed: {e}")
            raise

    async def process_order_safe(
        self,
        order_id: str,
        platform: str
    ) -> dict:
        """安全处理订单"""
        try:
            return await self.process_order(order_id, platform)
        except Exception as e:
            # 记录错误
            await self._log_error(order_id, str(e))

            # 通知管理员
            await self._alert_admin(order_id, str(e))

            # 返回错误响应
            return {
                "success": False,
                "error": str(e),
                "order_id": order_id
            }
```

---

## 案例分析

### 6.1 案例1：多平台客服自动化

**背景**：
- 某跨境电商在Amazon、eBay、Shopee三个平台销售
- 每天收到约500条客户咨询
- 客户使用英语、西班牙语、日语等多种语言

**解决方案**：
1. 部署CoPaw多语言客服Agent
2. 配置三个平台的Webhook集成
3. 实现自动翻译和回复

**效果**：
- 自动处理率：65%
- 平均响应时间：从2小时降至30秒
- 客户满意度：提升20%

### 6.2 案例2：智能价格监控

**背景**：
- 某电子产品电商有1000+SKU
- 竞争对手价格变化频繁
- 人工监控效率低下

**解决方案**：
1. 部署CoPaw价格监控Agent
2. 每30分钟自动检查竞品价格
3. 超过5%变化自动报警

**效果**：
- 价格响应速度：从1天降至30分钟
- 销售额提升：15%
- 库存周转率提升：25%

---

## 总结

本指南涵盖了CoPaw在跨境电商场景下的主要应用：

**核心能力**：
- 多语言智能客服
- 订单自动化处理
- 竞品价格监控
- 业务数据分析

**部署方案**：
- 单区域部署
- 多区域全球部署
- 高可用架构

**最佳实践**：
- 缓存优化
- 错误处理
- 安全合规

通过CoPaw的强大功能，跨境电商可以实现24/7自动化运营，显著提升效率和客户满意度。
