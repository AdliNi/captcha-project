from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
import time
import os

# === CONFIG ===
url = "https://captcha-ex.rf.gd/DummyPage.html"
extension_path = os.path.abspath(r"C:/xampp/htdocs/captcha-extension")  # Make sure it's absolute

# === Setup Chrome with Unpacked Extension ===
options = webdriver.ChromeOptions()
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument(f"--load-extension={extension_path}")
options.add_argument("--start-maximized")
# options.add_argument("--headless")  # Do NOT use headless if testing extension

# === Start Chrome Driver ===
print("🚀 Launching Chrome with extension...")
service = Service("chromedriver.exe")  # Ensure chromedriver matches your Chrome version
driver = webdriver.Chrome(service=service, options=options)

# === Allow time for extension to load ===
time.sleep(2)

# === Navigate to test page ===
print("🔍 Navigating to:", url)
driver.get(url)
time.sleep(2)

# === Simulate Bot-Like Behavior ===
try:
    actions = ActionChains(driver)

    print("🖱️ Simulating straight-line mouse movement...")
    for _ in range(14):
        actions.move_by_offset(50, 0)
        actions.pause(0.05)
    actions.perform()
    actions.reset_actions()

    print("⌨️ Simulating very fast typing...")
    body = driver.find_element(By.TAG_NAME, "body")
    body.click()
    for char in "botinputtext":
        body.send_keys(char)
        time.sleep(0.01)  # 🕒 Typing too fast, bot-like

    print("📜 Simulating fast scrolling...")
    for _ in range(15):
        driver.execute_script("window.scrollBy(0, 500);")
        time.sleep(0.05)  # Very fast scroll

except Exception as e:
    print("Bot simulation error:", e)

# === Monitor the result ===
print("Bot test completed. Waiting to observe CAPTCHA trigger...")
print("🌐 Current page:", driver.current_url)
time.sleep(60)

driver.quit()
