from bs4 import BeautifulSoup
import json
import re

def parse_menu(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')
    menu_data = {}

    # Find all category sections
    category_sections = soup.find_all('div', class_='accordion-wrapper')
    
    for section in category_sections:
        # Extract category name
        cat_button = section.find('button', class_='cat-name')
        if not cat_button:
            continue
            
        cat_name = cat_button.find('p').get_text(strip=True)
        # Remove the icon text (arrow) if any
        cat_name = cat_name.split('angle-up')[0].strip()
        cat_name = cat_name.split('\n')[0].strip()
        # Clean up category name (remove trailing icons or arrows)
        cat_name = re.sub(r'[^a-zA-Z0-9\s]', '', cat_name).strip()
        
        items_list = []
        
        # Find all item cards in this category section
        # Items are usually inside a panel div
        panel = section.find('div', class_='panel')
        if not panel:
            # Maybe they are direct children?
            item_cards = section.find_all('app-item-card')
        else:
            item_cards = panel.find_all('app-item-card')
            
        for item_card in item_cards:
            item_data = {}
            wrapper = item_card.find('div', class_='wrapper-card')
            if not wrapper:
                continue
                
            # 1. Extract image URL
            img_tag = wrapper.find('img', class_='card-img')
            if img_tag and img_tag.get('src'):
                item_data['img'] = img_tag['src']
            else:
                item_data['img'] = ""
                
            # 2. Extract item name
            name_tag = wrapper.find('p', class_='item-name')
            if name_tag:
                # The name is usually in a span
                spans = name_tag.find_all('span', recursive=False)
                name_found = False
                for span in spans:
                    text = span.get_text(strip=True)
                    text = ' '.join(text.split())
                    if text and text not in ['', '<!---->']:
                        item_data['name'] = text
                        name_found = True
                        break
                if not name_found:
                    full_text = name_tag.get_text(strip=True)
                    item_data['name'] = ' '.join(full_text.split())
            else:
                continue # Need a name
                
            # 3. Extract price
            price_found = False
            
            # Check for direct price in footer
            price_tag = wrapper.find('p', class_='item-price')
            if price_tag:
                price_text = price_tag.get_text(strip=True)
                # Some prices might have currency symbols or ranges
                digits = re.findall(r'\d+', price_text)
                if digits:
                    item_data['price'] = float(digits[0])
                    price_found = True
            
            # If not found, check the variations in the sibling single-item div
            if not price_found:
                # Need to find the sibling of the div containing the app-item-card
                # Based on structure: 
                # <div class="col ..."> <app-item-card> ... </app-item-card> <div class="row single-item"> ... </div> </div>
                parent_col = item_card.find_parent('div', class_='col')
                if parent_col:
                    single_item = parent_col.find('div', class_='single-item')
                    if single_item:
                        price_paras = single_item.find_all('p', class_='description')
                        for p in price_paras:
                            text = p.get_text(strip=True)
                            if text.isdigit():
                                item_data['price'] = float(text)
                                price_found = True
                                break
                            spans = p.find_all('span')
                            for span in spans:
                                span_text = span.get_text(strip=True)
                                if span_text.isdigit():
                                    item_data['price'] = float(span_text)
                                    price_found = True
                                    break
                            if price_found: break

            if not price_found:
                item_data['price'] = 0.0
                
            # 4. Veg/Non-Veg
            item_data['veg'] = True
            lower_name = item_data['name'].lower()
            if any(x in lower_name for x in ['chicken', 'egg', 'bacon', 'turkey', 'meat', 'fish', 'prawn']):
                item_data['veg'] = False
                
            # 5. Description
            desc_tag = wrapper.find('p', class_='item-description')
            if desc_tag and desc_tag.get_text(strip=True):
                item_data['desc'] = desc_tag.get_text(strip=True)
            else:
                item_data['desc'] = f"Freshly prepared {item_data['name']}."
                
            items_list.append(item_data)
            
        if items_list:
            menu_data[cat_name] = items_list
            
    return menu_data

if __name__ == "__main__":
    data = parse_menu('source_menu.html')
    # Save to file as well for reference
    with open('parsed_menu.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(json.dumps(data, indent=2))
