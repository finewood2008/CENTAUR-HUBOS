# 云端算力结算系统对接 (CLOUD_BILLING_PRD)

## 设备出厂机制 (Device_Key)
每一台 Centaur Hub 硬件在生产线上，必须由云端签发一张不可篡改的凭证（Device_Key），烧录入主板安全芯片或加密存储中。

## 计费拦截流
1. Hub 上的数字员工需要大模型推理时，向云端 Centaur Gateway 发起请求。
2. 请求 Header 中携带 `Device_Key`。
3. Gateway 校验该设备账户下剩余的 `Credits`（电量）。
4. 如果电量充足，Gateway 使用大客户 API_KEY 转发请求至 OpenAI/Claude，获取结果后，根据实际消耗的 Token 从设备账户扣除。
5. 硬件本身在界面上显示“剩余可用电量”。
