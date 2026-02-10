# Coffee Nation - Sophisticated Client Onboarding

## Overview
This directory contains the sophisticated onboarding automation for **Coffee Nation**, designed to create a high-fidelity demo environment with authentic menu data, images, and multi-outlet infrastructure.

## Files

### `onboard_coffee_nation.py`
**Purpose**: Python-based automation service for complete client provisioning.

**Features**:
- ✅ Super Admin authentication with bootstrap fallback
- ✅ Tenant creation and management
- ✅ Multi-outlet setup (FC Road, Kalyani Nagar, Aundh)
- ✅ Authentic menu data with real image URLs
- ✅ Table and employee provisioning
- ✅ Intelligent duplicate detection and updates
- ✅ Comprehensive logging

**Usage**:
```bash
# Default (localhost:8080)
python3 onboard_coffee_nation.py

# Custom backend URL
python3 onboard_coffee_nation.py http://your-backend:8080
```

**Credentials**:
- **Email**: `corporate@coffeenation.com`
- **Password**: `Coffee@2026`

### `kickstart_client_coffee_nation.sh`
**Purpose**: Legacy shell script (deprecated in favor of Python service).

**Status**: ⚠️ Deprecated - Use `onboard_coffee_nation.py` instead for better error handling and image support.

## Data Sources

### Menu Data
The menu data is sourced from authentic Coffee Nation menu items with real image URLs from their digital menu system:

- **Category**: Hot Beverages (13 items)
- **Image CDN**: `airmenusimages.blr1.cdn.digitaloceanspaces.com`
- **Price Range**: ₹140 - ₹230
- **Items Include**: Americano, Cappuccino, Cinnamon Latte, Flat White, Affogato, Espresso, and more

### Outlets
Three premium locations in Pune:
1. **Coffee Nation - FC Road** (18.5196°N, 73.8437°E)
2. **Coffee Nation - Kalyani Nagar** (18.5463°N, 73.9033°E)
3. **Coffee Nation - Aundh** (18.5602°N, 73.8031°E)

## Architecture

### Workflow
```
1. Super Admin Auth → 2. Tenant Creation → 3. Client Admin Login
                                ↓
4. Outlet Setup → 5. Table/Employee Provisioning → 6. Menu Seeding
```

### Key Components

#### Authentication Layer
- Primary: `/api/v1/admin/auth/login`
- Fallback: `/api/v1/bootstrap/admin`

#### Provisioning Layer
- Tenant Management: `/api/v1/admin/tenants`
- Outlet Management: `/api/v1/admin/outlets`
- Menu Management: `/api/v1/admin/outlets/{id}/menu/categories` & `/items`

#### Data Enrichment
- Duplicate Detection: Checks existing items by name and category
- Smart Updates: Uses PUT to refresh images and details for existing items
- Idempotent Operations: Safe to run multiple times

## Integration Points

### Backend Integration
The `LeadService.java` includes an `onboardClient(Long leadId)` method that serves as the integration point:

```java
@Transactional
public String onboardClient(Long leadId) {
    Lead lead = leadRepository.findById(leadId);
    if (lead == null) {
        throw new IllegalArgumentException("Lead not found");
    }
    
    // TODO: Trigger Python onboarding service
    // Future: Use ProcessBuilder or dedicated Microservice
    
    lead.status = LeadStatus.CONVERTED;
    lead.updatedAt = new Date();
    leadRepository.persist(lead);
    
    return "PENDING_PROVISIONING"; 
}
```

### Future Enhancements
1. **Async Execution**: Wrap Python script in ProcessBuilder for non-blocking execution
2. **Webhook Callbacks**: Notify frontend when provisioning completes
3. **Progress Tracking**: Real-time status updates during onboarding
4. **Multi-Client Support**: Parameterize script for different restaurant chains
5. **Web Scraping**: Automated menu extraction from public websites

## Dependencies

### Python Requirements
```bash
pip3 install requests beautifulsoup4
```

### System Requirements
- Python 3.9+
- Network access to FoodGrid backend
- Super Admin credentials

## Troubleshooting

### Common Issues

**Issue**: `Super Admin login failed`
- **Solution**: Ensure backend is running and credentials are correct
- **Fallback**: Script automatically attempts bootstrap

**Issue**: `Failed to create client`
- **Solution**: Check if tenant already exists (script handles duplicates)
- **Debug**: Review backend logs for constraint violations

**Issue**: `Menu items missing images`
- **Solution**: Verify CDN URLs are accessible
- **Check**: Run script again - it will update existing items with images

**Issue**: `Connection refused`
- **Solution**: Verify BASE_URL points to running backend
- **Default**: `http://localhost:8080`

## Monitoring

### Success Indicators
```
[FoodGrid-Py] ✅ Onboarding Complete! Pitch Ready.
[FoodGrid-Py] Client Email: corporate@coffeenation.com
[FoodGrid-Py] Password:     Coffee@2026
```

### Log Patterns
- `   + Menu Item: {name}` - New item created
- `   . Item exists: {name} - Updating details...` - Existing item found
- `   ✓ Updated Image/Details for {name}` - Successfully updated
- `   ! Failed to add {name}` - Error occurred

## Security Notes

⚠️ **Important**: This script is designed for demo/development environments.

**Production Considerations**:
- Store credentials in environment variables or secrets manager
- Implement rate limiting and retry logic
- Add comprehensive error handling and rollback mechanisms
- Use service accounts instead of admin credentials
- Encrypt sensitive data in transit and at rest

## Performance

**Typical Execution Time**:
- Tenant Creation: ~500ms
- Per Outlet Setup: ~2s (includes tables, employees, menu)
- Total (3 outlets): ~6-8 seconds

**Optimization Opportunities**:
- Parallel outlet provisioning
- Batch menu item creation
- Connection pooling
- Caching category IDs

## License
Internal FoodGrid tooling - Not for external distribution.

---

**Last Updated**: 2026-02-10  
**Maintained By**: FoodGrid Engineering Team  
**Contact**: For issues or enhancements, contact the backend team.
