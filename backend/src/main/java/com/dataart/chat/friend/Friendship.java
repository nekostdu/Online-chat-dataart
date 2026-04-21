package com.dataart.chat.friend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "friendships")
@IdClass(Friendship.PK.class)
public class Friendship {

    @Id
    @Column(name = "requester_id")
    private Long requesterId;

    @Id
    @Column(name = "addressee_id")
    private Long addresseeId;

    /** "pending" or "accepted" */
    @Column(nullable = false, length = 16)
    private String status;

    @Column(length = 500)
    private String message;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    public Long getRequesterId() { return requesterId; }
    public Long getAddresseeId() { return addresseeId; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getConfirmedAt() { return confirmedAt; }

    public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }
    public void setAddresseeId(Long addresseeId) { this.addresseeId = addresseeId; }
    public void setStatus(String status) { this.status = status; }
    public void setMessage(String message) { this.message = message; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }

    public boolean isAccepted() { return "accepted".equals(status); }
    public boolean isPending()  { return "pending".equals(status); }

    public static class PK implements Serializable {
        private Long requesterId;
        private Long addresseeId;

        public PK() {}
        public PK(Long requesterId, Long addresseeId) {
            this.requesterId = requesterId;
            this.addresseeId = addresseeId;
        }

        public Long getRequesterId() { return requesterId; }
        public Long getAddresseeId() { return addresseeId; }
        public void setRequesterId(Long requesterId) { this.requesterId = requesterId; }
        public void setAddresseeId(Long addresseeId) { this.addresseeId = addresseeId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(requesterId, pk.requesterId) && Objects.equals(addresseeId, pk.addresseeId);
        }

        @Override
        public int hashCode() { return Objects.hash(requesterId, addresseeId); }
    }
}
