package com.foodgrid.lead.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "discovery_logs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"city", "area", "category"})
})
public class DiscoveryLog extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(nullable = false, length = 100)
    public String city;

    @Column(nullable = false, length = 100)
    public String area;

    @Column(nullable = false, length = 100)
    public String category;

    @Column(name = "last_discovered_at")
    public Date lastDiscoveredAt = new Date();

    @Column(name = "result_count")
    public Integer resultCount = 0;
}
