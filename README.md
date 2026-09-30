# ITserve

MERN-stack project structure for IT Support & Asset Management.

Application areas:
- IT support tickets
- Lab and hardware management
- Inventory and asset assignment
- Vendor coordination
- Warranty tracking
- Branch visits
- User and device records
- Hardware disposal

## Inventory register

The Inventory Management overview imports inventory copied from Excel. In
Excel, copy the inventory cells and paste them into the import panel. Review the
preview, then import the rows into MongoDB. The API endpoints are
`GET /api/inventory/summary` and `POST /api/inventory/import` (JSON body:
`{ "records": [...] }`); both require the `inventory` permission.

The importer recognizes the inventory workbook's column headers and also
accepts its original column order without a header row. Repeated identical rows
are refreshed rather than inserted again.

Locations with more than 10 PC or Laptop rows are classified as back offices.
Those PC and Laptop records appear in Back Office Inventory. Other device types
and peripherals appear in Branch Inventory, including equipment recorded on the
same rows as PCs and Laptops. Locations with 10 or fewer PC or Laptop rows keep
all their inventory in Branch Inventory. BIO and LED summaries are grouped by
their make fields.
