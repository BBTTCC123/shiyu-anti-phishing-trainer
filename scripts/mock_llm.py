# -*- coding: utf-8 -*-
"""本地 mock OpenAI 兼容服务（SSE 流式），用于端到端测试智能体云链路。端口 8766。"""
import json
import re
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(n) or b"{}")
        msgs = body.get("messages", [])
        sys = msgs[0].get("content", "") if msgs else ""
        user = msgs[-1].get("content", "") if msgs else ""

        if "回声测试" in sys:
            reply = "OK"
        elif "训练教练" in sys:
            rank = re.search(r'"段位"\s*:\s*"([^"]+)"', user)
            avg = re.search(r'"五维均分"\s*:\s*([0-9]+)', user)
            post = re.search(r'"后测识别率"\s*:\s*([0-9]+)', user)
            reply = ("①【总评】段位" + (rank.group(1) if rank else "未知") +
                     "，五维均分" + (avg.group(1) if avg else "--") + "——底子在线，但识别还没变成条件反射。\n"
                     "②【薄弱分析】紧迫感抗压是本轮最低：你在“逾期未核验视为放弃”这类限时话术上失手，倒计时仍在压缩你的判断时间。\n"
                     "③【训练处方】每天一轮拦截战、专盯紧迫话术类样本；拆解台遇到限时证物先默数十秒再归位；用造浪者自由撰写给自己出一道限时题。\n"
                     "④【一句提醒】真机构从不用倒计时逼你。后测识别率" + (post.group(1) if post else "--") +
                     "%说明训练有效，遇到限时就停一分钟、走官方渠道；涉及资金拨96110。")
        elif "反诈骗研判警官" in sys:
            reply = ("【判定：高危（风险分 88/99）】这是一起典型的冒充熟人+资金转移诈骗。\n"
                     "■ 可疑要素：「" + user[:24] + "」——要求向个人账户转账属高危信号。\n"
                     "■ 剧本研判：吻合冒充熟人诈骗；预测下一步会以“马上要报账”催促并更换收款卡号。\n"
                     "■ 立即行动：停止转账；电话/当面核实身份；保留记录；拨 96110。")
        else:
            reply = "（云端mock）关于「" + user[:16] + "」——接入真实 Key 后这里就是大模型的自由回答，任何问题都能答。"

        if body.get("stream"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self._cors()
            self.end_headers()
            for ch in reply:
                chunk = {"choices": [{"delta": {"content": ch}}]}
                self.wfile.write(("data: " + json.dumps(chunk, ensure_ascii=False) + "\n\n").encode("utf-8"))
                self.wfile.flush()
                time.sleep(0.004)
            self.wfile.write(b"data: [DONE]\n\n")
        else:
            out = json.dumps({"choices": [{"message": {"content": reply}}]}, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(out)))
            self._cors()
            self.end_headers()
            self.wfile.write(out)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8766), H).serve_forever()
