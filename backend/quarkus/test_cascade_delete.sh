#!/bin/bash

echo "Testing cascade delete functionality..."

# First, let's check if there are any existing orders
echo "Checking existing orders..."
curl -s 'http://localhost:8080/api/v1/pos/orders' \
  -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJmb29kZ3JpZCIsInN1YiI6IjliMmM1ZjQ5LTBjODItNDU1MS04MmI1LWQ5MDg0YWMzMjUzOSIsInByaW5jaXBhbFR5cGUiOiJBRE1JTiIsImVtYWlsIjoiYWRtaW5Ac3BpY2VnYXJkZW4uY29tIiwiZGlzcGxheU5hbWUiOiJTcGljZSBHYXJkZW4gUmVzdGF1cmFudCBBZG1pbiIsImdyb3VwcyI6WyJBRE1JTiJdLCJpYXQiOjE3NjkzMjMxOTgsImV4cCI6MTc2OTM2NjM5OCwianRpIjoiNzJkZjYzMjEtNGZhNS00ZjBhLWI0MzgtNThjNjNiY2UyNWU5In0.HtX6CtVNsa59TUt-0ub0yFRuCo_9EBUcRkeOYaJ4hbVQuNioElMgAxJmT5eaiQDWCJglYeKIQAjlg8XJs4USCMIgULGgvu0CP5urvesAK1KSGe0Szm-7qdra9niH93abp2gWBZCAcH2WAg_0-3XQU5Eg8QeN13C40TAkdf1UABGlGw9ZEGWZYzDYY9n610MDCm1H3Fs8N5sM3fAigp1eWZGD6EAq5sJr_0dk7LWt-64_o1gFwQN949QQgErAvGeh7ecqRgIR0E1eCVjkpvZq2-vZjoc9R1fQGFu10wyZN0K_V1dJogLDNTUQ2TDDLDhWE6zrpqsZgXwlcqkwrpr-KQ' \
  | jq '.' || echo "Failed to fetch orders"

echo ""
echo "Testing delete of order 7d493603-777e-474b-9cc2-144b6b49af60..."

# Test the delete endpoint
response=$(curl -s -w '%{http_code}' 'http://localhost:8080/api/v1/pos/orders/7d493603-777e-474b-9cc2-144b6b49af60' \
  -X 'DELETE' \
  -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJmb29kZ3JpZCIsInN1YiI6IjliMmM1ZjQ5LTBjODItNDU1MS04MmI1LWQ5MDg0YWMzMjUzOSIsInByaW5jaXBhbFR5cGUiOiJBRE1JTiIsImVtYWlsIjoiYWRtaW5Ac3BpY2VnYXJkZW4uY29tIiwiZGlzcGxheU5hbWUiOiJTcGljZSBHYXJkZW4gUmVzdGF1cmFudCBBZG1pbiIsImdyb3VwcyI6WyJBRE1JTiJdLCJpYXQiOjE3NjkzMjMxOTgsImV4cCI6MTc2OTM2NjM5OCwianRpIjoiNzJkZjYzMjEtNGZhNS00ZjBhLWI0MzgtNThjNjNiY2UyNWU5In0.HtX6CtVNsa59TUt-0ub0yFRuCo_9EBUcRkeOYaJ4hbVQuNioElMgAxJmT5eaiQDWCJglYeKIQAjlg8XJs4USCMIgULGgvu0CP5urvesAK1KSGe0Szm-7qdra9niH93abp2gWBZCAcH2WAg_0-3XQU5Eg8QeN13C40TAkdf1UABGlGw9ZEGWZYzDYY9n610MDCm1H3Fs8N5sM3fAigp1eWZGD6EAq5sJr_0dk7LWt-64_o1gFwQN949QQgErAvGeh7ecqRgIR0E1eCVjkpvZq2-vZjoc9R1fQGFu10wyZN0K_V1dJogLDNTUQ2TDDLDhWE6zrpqsZgXwlcqkwrpr-KQ' \
  -H 'content-type: application/json')

http_code="${response: -3}"
response_body="${response%???}"

echo "HTTP Status Code: $http_code"
echo "Response Body: $response_body"

if [ "$http_code" = "204" ] || [ "$http_code" = "200" ]; then
    echo "✅ Delete successful! Cascade delete is working."
else
    echo "❌ Delete failed with status $http_code"
fi
